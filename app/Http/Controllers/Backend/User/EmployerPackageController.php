<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerPackageController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $employer = $request->user();

        $packages = Package::query()->where('is_active', true)->orderBy('sort_order')->orderBy('price')->get()->map(fn (Package $package) => [
            'id' => $package->id,
            'slug' => $package->slug,
            'name' => $package->name,
            'price' => $package->price,
            'currency' => $package->currency,
            'billing_period' => $package->billing_period,
            'job_credits' => $package->job_credits,
            'featured_credits' => $package->featured_credits,
            'current' => $employer?->package?->value === $package->slug,
        ]);

        $invoices = Payment::query()
            ->where('employer_id', $employer?->id)
            ->with('package:id,name')
            ->latest()
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'package' => $payment->package?->name ?? '—',
                'amount' => $payment->amount,
                'status' => $payment->status?->label(),
                'date' => $payment->paid_at?->toDateString() ?? $payment->created_at?->toDateString(),
            ]);

        return Inertia::render('backend/User/EmployerPackages', [
            'current' => $employer?->package?->value,
            'current_label' => $employer?->package?->label(),
            'packages' => $packages,
            'invoices' => $invoices,
        ]);
    }
}
