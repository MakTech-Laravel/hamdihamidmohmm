<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\SelectEmployerPackageRequest;
use App\Models\Package;
use App\Models\Payment;
use App\Support\EmployerPlanSnapshot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmployerPackageController extends Controller
{
    public function index(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $plan = EmployerPlanSnapshot::for($employer);

        $packages = Package::query()
            ->publicActive()
            ->get()
            ->map(fn (Package $package) => [
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
                'current' => $employer->package?->value === $package->slug,
                'features' => collect($package->displayFeatures())
                    ->map(fn (array $feature): array => [
                        'key' => $feature['key'],
                        'label' => Package::localizedLabel($feature['key']) ?? $feature['key'],
                        'included' => $feature['included'],
                    ])
                    ->values()
                    ->all(),
            ]);

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
            ]);

        return Inertia::render('backend/User/EmployerPackages', [
            'plan' => $plan,
            'packages' => $packages,
            'invoices' => $invoices,
        ]);
    }

    public function select(SelectEmployerPackageRequest $request, Package $package): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        abort_unless($package->is_active && $package->is_public, 404);

        $enum = EmployerPackage::tryFrom($package->slug);
        abort_unless($enum instanceof EmployerPackage, 422);

        if ($employer->package === $enum) {
            return back()->with('success', 'This is already your current plan.');
        }

        $employer->forceFill(['package' => $enum])->save();

        Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => $package->price,
            'currency' => $package->currency,
            'method' => 'invoice',
            'status' => PaymentStatus::Completed,
            'reference' => 'INV-'.now()->format('Y').'-'.Str::upper(Str::random(4)),
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Your plan has been updated.');
    }
}
