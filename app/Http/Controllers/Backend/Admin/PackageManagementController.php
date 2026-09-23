<?php

namespace App\Http\Controllers\Backend\Admin;

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

        $packages = Package::query()->orderBy('sort_order')->orderBy('price')->get();
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
                'description' => Package::localizedLabel($package->description),
                'price' => $package->price,
                'currency' => $package->currency,
                'billing_period' => $package->billing_period,
                'job_credits' => $package->job_credits,
                'featured_credits' => $package->featured_credits,
                'features' => Package::localizedList($package->features),
                'excluded_features' => Package::localizedList($package->excluded_features),
                'is_active' => $package->is_active,
                'is_featured' => $package->is_featured,
                'is_public' => $package->is_public,
                'sort_order' => $package->sort_order,
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
                'most_popular' => $packages
                    ->first(fn (Package $package): bool => $package->is_featured && $package->is_active)
                    ?->name
                    ?? $packages
                        ->filter(fn (Package $package): bool => $package->is_active)
                        ->sortByDesc(fn (Package $package): int => (int) ($subscriberCounts[$package->slug] ?? 0))
                        ->first()
                        ?->name
                    ?? '—',
            ],
        ]);
    }

    public function store(StorePackageRequest $request): RedirectResponse
    {
        Package::query()->create([
            ...$request->safe()->except(['is_active', 'is_featured', 'is_public']),
            'currency' => $request->string('currency')->toString() ?: 'SDG',
            'is_active' => $request->boolean('is_active', true),
            'is_featured' => $request->boolean('is_featured'),
            'is_public' => $request->boolean('is_public', true),
        ]);

        return back()->with('success', 'Package created successfully.');
    }

    public function update(UpdatePackageRequest $request, Package $package): RedirectResponse
    {
        $package->update([
            ...$request->safe()->except(['is_active', 'is_featured', 'is_public']),
            'is_active' => $request->boolean('is_active', $package->is_active),
            'is_featured' => $request->boolean('is_featured', $package->is_featured),
            'is_public' => $request->boolean('is_public', $package->is_public),
        ]);

        return back()->with('success', 'Package updated successfully.');
    }

    public function destroy(Request $request, Package $package): RedirectResponse
    {
        abort_unless($request->user()?->canManagePackages(), 403);

        if (! $request->boolean('permanent')) {
            $package->update(['is_active' => false]);

            return back()->with('success', 'Package archived.');
        }

        $package->delete();

        return back()->with('success', 'Package permanently deleted.');
    }
}
