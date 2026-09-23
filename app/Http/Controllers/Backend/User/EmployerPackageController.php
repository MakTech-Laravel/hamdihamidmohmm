<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\PaymentStatus;
use App\Enums\PlanChangeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\SelectEmployerPackageRequest;
use App\Http\Requests\Backend\User\SubmitManualPackagePaymentRequest;
use App\Models\Package;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Services\EmployerPlanActivator;
use App\Services\YallaPay\YallaPayPackageCheckoutService;
use App\Support\EmployerPlanChange;
use App\Support\EmployerPlanSnapshot;
use App\Support\PortalNotifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class EmployerPackageController extends Controller
{
    public function __construct(
        private EmployerPlanActivator $planActivator,
        private YallaPayPackageCheckoutService $yallaPayCheckout,
    ) {}

    public function index(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        $plan = EmployerPlanSnapshot::for($employer);
        $currentCatalog = EmployerPlanSnapshot::catalogPackage($employer->package);

        $packages = Package::query()
            ->publicActive()
            ->get()
            ->map(function (Package $package) use ($employer, $currentCatalog): array {
                $action = $employer->package?->value === $package->slug
                    ? PlanChangeAction::Current
                    : EmployerPlanChange::action($currentCatalog, $package);

                return [
                    'id' => $package->id,
                    'slug' => $package->slug,
                    'name' => Package::localizedLabel($package->name) ?? $package->name,
                    'description' => Package::localizedLabel($package->description),
                    'price' => $package->price,
                    'currency' => $package->currency,
                    'billing_period' => $package->billing_period,
                    'job_credits' => $package->job_credits,
                    'featured_credits' => $package->featured_credits,
                    'is_featured' => $package->is_featured,
                    'current' => $action === PlanChangeAction::Current,
                    'action' => $action->value,
                    'scheduled' => $employer->pending_package?->value === $package->slug,
                    'features' => collect($package->displayFeatures())
                        ->map(fn (array $feature): array => [
                            'key' => $feature['key'],
                            'label' => Package::localizedLabel($feature['key']) ?? $feature['key'],
                            'included' => $feature['included'],
                        ])
                        ->values()
                        ->all(),
                ];
            });

        $invoices = Payment::query()
            ->where('employer_id', $employer->id)
            ->with('package:id,name,currency')
            ->latest()
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'package' => $payment->package?->name ?? '—',
                'amount' => $payment->amount,
                'currency' => $payment->package?->currency ?? $payment->currency,
                'status' => $payment->status === PaymentStatus::Completed ? 'Paid' : ($payment->status?->label() ?? '—'),
                'status_value' => $payment->status?->value,
                'date' => $payment->paid_at?->toFormattedDateString() ?? $payment->created_at?->toFormattedDateString(),
                'invoice_url' => $payment->invoice_url,
            ]);

        if ($request->string('checkout')->toString() === 'canceled') {
            session()->now('error', 'Checkout was canceled. No payment was taken.');
        }

        $paymentSettings = PlatformSetting::grouped()['payments'] ?? [];

        return Inertia::render('backend/User/EmployerPackages', [
            'plan' => $plan,
            'packages' => $packages,
            'invoices' => $invoices,
            'billing' => [
                'enabled' => $this->yallaPayCheckout->enabled(),
                'provider' => $this->yallaPayCheckout->enabled() ? 'yallapay' : null,
                'manual_enabled' => true,
            ],
            'bankDetails' => [
                'bank_name' => (string) ($paymentSettings['bank_name'] ?? ''),
                'bank_account_name' => (string) ($paymentSettings['bank_account_name'] ?? ''),
                'bank_account_number' => (string) ($paymentSettings['bank_account_number'] ?? ''),
                'bank_iban' => (string) ($paymentSettings['bank_iban'] ?? ''),
                'bank_instructions' => (string) ($paymentSettings['bank_instructions'] ?? ''),
            ],
        ]);
    }

    public function select(SelectEmployerPackageRequest $request, Package $package): RedirectResponse|HttpResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        try {
            if ($package->price < 1) {
                $result = $this->planActivator->activateComplimentary($employer, $package);
            } elseif ($this->yallaPayCheckout->enabled()) {
                $result = $this->yallaPayCheckout->startCheckout($employer, $package);
            } else {
                return back()->with(
                    'error',
                    'Online checkout is unavailable. Please submit a bank transfer receipt for review.',
                );
            }
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        if (($result['status'] ?? null) === 'redirect' && is_string($result['url'] ?? null)) {
            return Inertia::location($result['url']);
        }

        return back()->with('success', $result['message']);
    }

    public function submitManualPayment(SubmitManualPackagePaymentRequest $request, Package $package): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        abort_unless($package->is_active && $package->is_public, 404);

        if ($package->price < 1) {
            return back()->with('error', 'This package does not require a payment receipt.');
        }

        $pendingExists = Payment::query()
            ->where('employer_id', $employer->id)
            ->where('package_id', $package->id)
            ->where('method', 'bank_transfer')
            ->where('status', PaymentStatus::Pending)
            ->exists();

        if ($pendingExists) {
            return back()->with('error', 'You already have a pending bank transfer for this package. Please wait for admin review.');
        }

        $receipt = $request->file('receipt');
        $path = $receipt->store('payment-receipts/'.$employer->id, 'public');

        $payment = Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => $package->price,
            'currency' => $package->currency ?: 'SDG',
            'method' => 'bank_transfer',
            'status' => PaymentStatus::Pending,
            'reference' => 'BANK-'.Str::upper(Str::random(8)),
            'remarks' => $request->string('remarks')->toString(),
            'receipt_path' => $path,
        ]);

        PortalNotifier::billingAlert(
            $employer,
            'Payment submitted for review',
            "Your {$package->name} bank transfer ({$payment->reference}) was submitted and is awaiting admin approval.",
        );

        return back()->with('success', 'Payment receipt submitted. An admin will review and activate your package.');
    }

    public function checkoutSuccess(Request $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        $reference = $request->string('reference')->toString();

        if ($reference === '') {
            return redirect()->route('employer.packages')->with('error', 'Missing YallaPay payment reference.');
        }

        $payment = Payment::query()
            ->where('reference', $reference)
            ->where('employer_id', $employer->id)
            ->where('method', 'yallapay')
            ->first();

        if (! $payment instanceof Payment) {
            return redirect()->route('employer.packages')->with('error', 'YallaPay payment was not found.');
        }

        $confirmed = $this->yallaPayCheckout->confirmFromRedirect($reference)
            || $this->yallaPayCheckout->fulfillByReference($reference);

        if (! $confirmed && $payment->fresh()?->status !== PaymentStatus::Completed) {
            return redirect()->route('employer.packages')->with(
                'success',
                'Payment submitted. Your plan will activate once YallaPay confirms the payment.',
            );
        }

        return redirect()->route('employer.packages')->with('success', 'Payment received. Your plan is now active.');
    }
}
