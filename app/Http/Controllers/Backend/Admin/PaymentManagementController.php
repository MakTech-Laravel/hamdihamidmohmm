<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StorePaymentRequest;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManagePayments(), 403);

        $status = $request->string('status')->toString();
        $range = $request->string('range')->toString() ?: '30d';

        $paymentsQuery = Payment::query()->with(['employer:id,name,company_name', 'package:id,name'])->latest();

        if (PaymentStatus::tryFrom($status) instanceof PaymentStatus) {
            $paymentsQuery->where('status', $status);
        }

        $payments = $paymentsQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Payment $payment) => $this->row($payment));

        return Inertia::render('backend/Admin/PaymentsRevenue', [
            'payments' => $payments,
            'filters' => ['status' => $status, 'range' => $range],
            'stats' => $this->stats(),
            'chart' => $this->chart($range),
            'employers' => User::query()->where('role', UserRole::Employer)->orderBy('company_name')->get(['id', 'name', 'company_name']),
            'packages' => Package::query()->orderBy('name')->get(['id', 'name', 'price']),
        ]);
    }

    public function store(StorePaymentRequest $request): RedirectResponse
    {
        $status = PaymentStatus::from($request->string('status')->toString());

        Payment::query()->create([
            'employer_id' => $request->integer('employer_id'),
            'package_id' => $request->filled('package_id') ? $request->integer('package_id') : null,
            'amount' => $request->integer('amount'),
            'currency' => 'AED',
            'method' => $request->string('method')->toString(),
            'status' => $status,
            'reference' => $request->string('reference')->toString() ?: 'PAY-'.Str::upper(Str::random(8)),
            'paid_at' => $status === PaymentStatus::Completed ? now() : null,
        ]);

        if ($status === PaymentStatus::Completed && $request->filled('package_id')) {
            $package = Package::query()->find($request->integer('package_id'));
            $employer = User::query()->find($request->integer('employer_id'));

            if ($package && $employer) {
                $employer->forceFill(['package' => $package->slug])->save();
            }
        }

        return back()->with('success', 'Payment recorded.');
    }

    public function approve(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($request->user()?->canManagePayments(), 403);

        $payment->forceFill([
            'status' => PaymentStatus::Completed,
            'paid_at' => $payment->paid_at ?? now(),
        ])->save();

        $payment->loadMissing(['package', 'employer']);

        if ($payment->package && $payment->employer) {
            $payment->employer->forceFill(['package' => $payment->package->slug])->save();
        }

        return back()->with('success', 'Payment approved.');
    }

    public function refund(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($request->user()?->canManagePayments(), 403);

        $payment->forceFill(['status' => PaymentStatus::Refunded])->save();

        return back()->with('success', 'Payment refunded.');
    }

    public function retry(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($request->user()?->canManagePayments(), 403);

        $payment->forceFill(['status' => PaymentStatus::Pending])->save();

        return back()->with('success', 'Payment queued for retry.');
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->canManagePayments(), 403);

        $filename = 'payments-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Reference', 'Employer', 'Package', 'Amount', 'Method', 'Status', 'Paid at']);

            Payment::query()->with(['employer', 'package'])->latest()->each(function (Payment $payment) use ($handle): void {
                fputcsv($handle, [
                    $payment->reference,
                    $payment->employer?->company_name ?: $payment->employer?->name,
                    $payment->package?->name,
                    $payment->amount,
                    $payment->method,
                    $payment->status?->label(),
                    $payment->paid_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'reference' => $payment->reference,
            'employer' => $payment->employer?->company_name ?: $payment->employer?->name,
            'package' => $payment->package?->name ?? '—',
            'amount' => $payment->amount,
            'method' => $payment->method,
            'status' => $payment->status?->label() ?? 'Pending',
            'status_value' => $payment->status?->value,
            'date' => $payment->paid_at?->toDateString() ?? $payment->created_at?->toDateString(),
        ];
    }

    /**
     * @return array{today: int, monthly: int, failed: int, refunded: int}
     */
    private function stats(): array
    {
        return [
            'today' => (int) Payment::query()->where('status', PaymentStatus::Completed)->whereDate('paid_at', today())->sum('amount'),
            'monthly' => (int) Payment::query()->where('status', PaymentStatus::Completed)->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
            'failed' => Payment::query()->where('status', PaymentStatus::Failed)->count(),
            'refunded' => Payment::query()->where('status', PaymentStatus::Refunded)->count(),
        ];
    }

    /**
     * @return array{range: string, labels: list<string>, values: list<int>}
     */
    private function chart(string $range): array
    {
        $days = match ($range) {
            '7d' => 7,
            '90d', '3m' => 90,
            '12m', '1y' => 0,
            default => 30,
        };

        $labels = [];
        $values = [];

        if ($days === 0) {
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->startOfMonth()->subMonths($i);
                $labels[] = $month->format('M');
                $values[] = (int) Payment::query()
                    ->where('status', PaymentStatus::Completed)
                    ->whereBetween('paid_at', [$month, $month->copy()->endOfMonth()])
                    ->sum('amount');
            }

            return ['range' => '12m', 'labels' => $labels, 'values' => $values];
        }

        for ($i = $days - 1; $i >= 0; $i--) {
            $day = now()->startOfDay()->subDays($i);
            $labels[] = $day->format('M j');
            $values[] = (int) Payment::query()
                ->where('status', PaymentStatus::Completed)
                ->whereDate('paid_at', $day->toDateString())
                ->sum('amount');
        }

        return ['range' => $range, 'labels' => $labels, 'values' => $values];
    }
}
