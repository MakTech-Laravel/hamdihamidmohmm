<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\ActivityAction;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\RejectEmployerRequest;
use App\Http\Requests\Backend\Admin\StoreEmployerRequest;
use App\Http\Requests\Backend\Admin\UpdateEmployerRequest;
use App\Models\User;
use App\Support\ActivityLogger;
use App\Support\PortalNotifier;
use App\Support\RoleAssigner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAccess($request);

        $statusFilter = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $employersQuery = User::query()
            ->role(RoleName::Employer->value)
            ->latest();

        $accountStatus = EmployerAccountStatus::fromFilter($statusFilter);

        if ($accountStatus instanceof EmployerAccountStatus) {
            $employersQuery->where('account_status', $accountStatus);
        }

        if ($search !== '') {
            $employersQuery->where(function ($query) use ($search): void {
                $query->where('company_name', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('industry', 'like', "%{$search}%");
            });
        }

        $employers = $employersQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $employer) => $this->employerRow($employer));

        return Inertia::render('backend/Admin/EmployerManagement', [
            'employers' => $employers,
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
            ],
            'stats' => $this->stats(),
            'options' => $this->formOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorizeAccess($request);

        return Inertia::render('backend/Admin/EmployerCreate', [
            'options' => $this->formOptions(),
        ]);
    }

    public function store(StoreEmployerRequest $request): RedirectResponse
    {
        $accountStatus = EmployerAccountStatus::from($request->string('account_status')->toString());

        $employer = User::query()->create([
            'name' => $request->string('contact_name')->toString(),
            'contact_name' => $request->string('contact_name')->toString(),
            'company_name' => $request->string('company_name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'email_verified_at' => now(),
            'role' => UserRole::Employer,
            'industry' => $request->filled('industry') ? $request->string('industry')->toString() : null,
            'package' => EmployerPackage::from($request->string('package')->toString()),
            'account_status' => $accountStatus,
            'verification_status' => $this->verificationForStatus($accountStatus),
            'verified_at' => $accountStatus === EmployerAccountStatus::Active ? now() : null,
        ]);

        RoleAssigner::assign($employer, UserRole::Employer);

        ActivityLogger::log(
            $employer,
            ActivityAction::AccountCreated,
            'Employer account created by an administrator.',
            $request->user(),
        );

        return to_route('admin.employers.show', $employer)
            ->with('success', 'Employer created successfully.');
    }

    public function show(Request $request, User $user): Response
    {
        $this->authorizeAccess($request);
        $this->ensureEmployer($user);

        $user->load(['activityLogs.actor']);

        return Inertia::render('backend/Admin/EmployerShow', [
            'employer' => $this->employerDetails($user),
            'activities' => $user->activityLogs
                ->take(50)
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action_label' => $log->action->label(),
                    'description' => $log->description,
                    'actor_name' => $log->actor?->name,
                    'created_at' => $log->created_at?->timezone(config('app.timezone'))->diffForHumans(),
                ])
                ->values(),
        ]);
    }

    public function edit(Request $request, User $user): Response
    {
        $this->authorizeAccess($request);
        $this->ensureEmployer($user);

        return Inertia::render('backend/Admin/EmployerEdit', [
            'employer' => $this->employerDetails($user),
            'options' => $this->formOptions(),
        ]);
    }

    public function update(UpdateEmployerRequest $request, User $user): RedirectResponse
    {
        $this->ensureEmployer($user);

        $accountStatus = EmployerAccountStatus::from($request->string('account_status')->toString());

        $user->forceFill([
            'name' => $request->string('contact_name')->toString(),
            'contact_name' => $request->string('contact_name')->toString(),
            'company_name' => $request->string('company_name')->toString(),
            'email' => $request->string('email')->toString(),
            'industry' => $request->filled('industry') ? $request->string('industry')->toString() : null,
            'package' => EmployerPackage::from($request->string('package')->toString()),
            'account_status' => $accountStatus,
            'verification_status' => $this->verificationForStatus($accountStatus, $user->verification_status),
        ]);

        if ($accountStatus === EmployerAccountStatus::Active && $user->verified_at === null) {
            $user->verified_at = now();
            $user->rejection_reason = null;
        }

        if ($request->filled('password')) {
            $user->password = $request->string('password')->toString();
        }

        $user->save();

        ActivityLogger::log(
            $user,
            ActivityAction::ProfileUpdated,
            'Employer details were updated by an administrator.',
            $request->user(),
        );

        return to_route('admin.employers.show', $user)
            ->with('success', 'Employer updated successfully.');
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        $this->authorizeVerificationAccess($request);
        $this->ensureEmployer($user);
        abort_unless($user->canApproveEmployer(), 403, 'Only pending employers can be approved.');

        $user->forceFill([
            'verification_status' => EmployerVerificationStatus::Approved,
            'account_status' => EmployerAccountStatus::Active,
            'rejection_reason' => null,
            'verified_at' => now(),
        ])->save();

        ActivityLogger::log(
            $user,
            ActivityAction::EmployerApproved,
            'Employer verification was approved.',
            $request->user(),
        );

        PortalNotifier::verificationApproved($user);

        return back()->with('success', 'Employer approved successfully.');
    }

    public function reject(RejectEmployerRequest $request, User $user): RedirectResponse
    {
        $this->ensureEmployer($user);

        $reason = $request->string('rejection_reason')->toString();

        $user->forceFill([
            'verification_status' => EmployerVerificationStatus::Rejected,
            'account_status' => EmployerAccountStatus::Rejected,
            'rejection_reason' => $reason,
        ])->save();

        ActivityLogger::log(
            $user,
            ActivityAction::EmployerRejected,
            'Employer verification was rejected.',
            $request->user(),
            ['reason' => $user->rejection_reason],
        );

        PortalNotifier::verificationRejected($user, $reason);

        return back()->with('success', 'Employer rejected successfully.');
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorizeAccess($request);

        $statusFilter = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $employersQuery = User::query()
            ->role(RoleName::Employer->value)
            ->latest();

        $accountStatus = EmployerAccountStatus::fromFilter($statusFilter);

        if ($accountStatus instanceof EmployerAccountStatus) {
            $employersQuery->where('account_status', $accountStatus);
        }

        if ($search !== '') {
            $employersQuery->where(function ($query) use ($search): void {
                $query->where('company_name', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('industry', 'like', "%{$search}%");
            });
        }

        $filename = 'employers-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($employersQuery): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Company',
                'Industry',
                'Contact',
                'Email',
                'Verification',
                'Package',
                'Status',
                'Registered',
            ]);

            $employersQuery->each(function (User $employer) use ($handle): void {
                fputcsv($handle, [
                    $employer->company_name,
                    $employer->industry,
                    $employer->contact_name ?: $employer->name,
                    $employer->email,
                    $employer->verification_status?->label(),
                    $employer->package?->label(),
                    $employer->account_status?->label(),
                    $employer->created_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function authorizeAccess(Request $request): void
    {
        abort_unless($request->user()?->canManageEmployers(), 403);
    }

    private function authorizeVerificationAccess(Request $request): void
    {
        $actor = $request->user();

        abort_unless(
            $actor?->canManageEmployers() === true || $actor?->canManageVerification() === true,
            403,
        );
    }

    private function ensureEmployer(User $user): void
    {
        abort_unless($user->isEmployer(), 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function employerRow(User $employer): array
    {
        return [
            'id' => $employer->id,
            'company_name' => $employer->company_name ?: $employer->name,
            'industry' => $employer->industry ?: '—',
            'contact' => $employer->contact_name ?: $employer->name,
            'email' => $employer->email,
            'verification' => $employer->verification_status?->label() ?? 'Pending',
            'verification_value' => $employer->verification_status?->value,
            'package' => $employer->package?->label() ?? 'Starter',
            'jobs' => 0,
            'date' => $employer->created_at?->toDateString(),
            'status' => $employer->account_status?->label() ?? 'Pending Verification',
            'status_value' => $employer->account_status?->value,
            'can_review' => $employer->canApproveEmployer(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function employerDetails(User $employer): array
    {
        return [
            ...$this->employerRow($employer),
            'contact_name' => $employer->contact_name ?: $employer->name,
            'package_value' => $employer->package?->value ?? EmployerPackage::Starter->value,
            'rejection_reason' => $employer->rejection_reason,
            'verified_at' => $employer->verified_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
            'created_at' => $employer->created_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
            'updated_at' => $employer->updated_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
        ];
    }

    /**
     * @return array{total: int, active: int, pending: int, suspended: int, rejected: int}
     */
    private function stats(): array
    {
        $base = User::query()->role(RoleName::Employer->value);

        return [
            'total' => (clone $base)->count(),
            'active' => (clone $base)->where('account_status', EmployerAccountStatus::Active)->count(),
            'pending' => (clone $base)->where('account_status', EmployerAccountStatus::PendingVerification)->count(),
            'suspended' => (clone $base)->where('account_status', EmployerAccountStatus::Suspended)->count(),
            'rejected' => (clone $base)->where('account_status', EmployerAccountStatus::Rejected)->count(),
        ];
    }

    /**
     * @return array{industries: list<string>, packages: list<array{value: string, label: string}>, statuses: list<array{value: string, label: string}>}
     */
    private function formOptions(): array
    {
        return [
            'industries' => [
                'Technology',
                'Construction',
                'Finance',
                'Retail',
                'Logistics',
                'Healthcare',
                'Media',
                'Hospitality',
                'Education',
                'Other',
            ],
            'packages' => collect(EmployerPackage::cases())->map(fn (EmployerPackage $package) => [
                'value' => $package->value,
                'label' => $package->label(),
            ])->values()->all(),
            'statuses' => collect(EmployerAccountStatus::cases())->map(fn (EmployerAccountStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ])->values()->all(),
        ];
    }

    private function verificationForStatus(
        EmployerAccountStatus $status,
        ?EmployerVerificationStatus $current = null,
    ): EmployerVerificationStatus {
        return match ($status) {
            EmployerAccountStatus::Active => EmployerVerificationStatus::Approved,
            EmployerAccountStatus::PendingVerification => EmployerVerificationStatus::Pending,
            EmployerAccountStatus::Rejected => EmployerVerificationStatus::Rejected,
            EmployerAccountStatus::Suspended => $current ?? EmployerVerificationStatus::Approved,
        };
    }
}
