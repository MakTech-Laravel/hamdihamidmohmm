<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StorePackageRequest;
use App\Http\Requests\Backend\Admin\UpdatePackageRequest;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PackageManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManagePackages(), 403);

        $packages = Package::query()->orderBy('price')->get();
        $subscriberCounts = User::query()
            ->toBase()
            ->where('role', UserRole::Employer->value)
            ->selectRaw('package, COUNT(*) as aggregate')
            ->groupBy('package')
            ->pluck('aggregate', 'package');

        $revenueByPackage = Payment::query()
            ->where('status', PaymentStatus::Completed)
            ->selectRaw('package_id, SUM(amount) as aggregate')
            ->groupBy('package_id')
            ->pluck('aggregate', 'package_id');

        $rows = $packages->map(function (Package $package) use ($subscriberCounts, $revenueByPackage) {
            $subscribers = (int) ($subscriberCounts[$package->slug] ?? 0);

            return [
                'id' => $package->id,
                'slug' => $package->slug,
                'name' => $package->name,
                'price' => $package->price,
                'currency' => $package->currency,
                'billing_period' => $package->billing_period,
                'job_credits' => $package->job_credits,
                'featured_credits' => $package->featured_credits,
                'is_active' => $package->is_active,
                'subscribers' => $subscribers,
                'revenue' => (int) ($revenueByPackage[$package->id] ?? 0),
            ];
        });

        return Inertia::render('backend/Admin/PackagesPricing', [
            'packages' => $rows,
            'stats' => [
                'total' => $packages->count(),
                'subscribers' => $subscriberCounts->sum(),
                'monthly_sales' => (int) $revenueByPackage->sum(),
                'most_popular' => $rows->sortByDesc('subscribers')->first()['name'] ?? '—',
            ],
        ]);
    }

    public function store(StorePackageRequest $request): RedirectResponse
    {
        Package::query()->create([
            ...$request->safe()->except('is_active'),
            'currency' => 'AED',
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Package created successfully.');
    }

    public function update(UpdatePackageRequest $request, Package $package): RedirectResponse
    {
        $package->update([
            ...$request->safe()->except('is_active'),
            'is_active' => $request->boolean('is_active', $package->is_active),
        ]);

        return back()->with('success', 'Package updated successfully.');
    }

    public function destroy(Request $request, Package $package): RedirectResponse
    {
        abort_unless($request->user()?->canManagePackages(), 403);

        if (EmployerPackage::tryFrom($package->slug) instanceof EmployerPackage) {
            $package->update(['is_active' => false]);

            return back()->with('success', 'System package archived.');
        }

        $package->delete();

        return back()->with('success', 'Package deleted.');
    }
}
