<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\ActivityAction;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreJobSeekerRequest;
use App\Http\Requests\Backend\Admin\UpdateJobSeekerRequest;
use App\Models\User;
use App\Support\ActivityLogger;
use App\Support\RoleAssigner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobSeekerManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAccess($request);

        $statusFilter = $request->string('status')->toString();
        $locationFilter = $request->string('location')->toString();
        $search = $request->string('search')->toString();

        $seekersQuery = $this->filteredQuery($statusFilter, $locationFilter, $search);

        $seekers = $seekersQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $seeker) => $this->seekerRow($seeker));

        return Inertia::render('backend/Admin/JobSeekerManagement', [
            'jobSeekers' => $seekers,
            'filters' => [
                'status' => $statusFilter,
                'location' => $locationFilter,
                'search' => $search,
            ],
            'stats' => $this->stats(),
            'options' => $this->formOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorizeAccess($request);

        return Inertia::render('backend/Admin/JobSeekerCreate', [
            'options' => $this->formOptions(),
        ]);
    }

    public function store(StoreJobSeekerRequest $request): RedirectResponse
    {
        $seeker = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'email_verified_at' => now(),
            'role' => UserRole::JobSeeker,
            'phone' => $request->filled('phone') ? $request->string('phone')->toString() : null,
            'location' => $request->filled('location') ? $request->string('location')->toString() : null,
            'resume_status' => JobSeekerResumeStatus::from($request->string('resume_status')->toString()),
            'account_status' => JobSeekerAccountStatus::from($request->string('account_status')->toString()),
        ]);

        RoleAssigner::assign($seeker, UserRole::JobSeeker);

        ActivityLogger::log(
            $seeker,
            ActivityAction::AccountCreated,
            'Job seeker account created by an administrator.',
            $request->user(),
        );

        return to_route('admin.job-seekers.show', $seeker)
            ->with('success', 'Job seeker created successfully.');
    }

    public function show(Request $request, User $user): Response
    {
        $this->authorizeAccess($request);
        $this->ensureJobSeeker($user);

        $user->load(['activityLogs.actor']);

        return Inertia::render('backend/Admin/JobSeekerShow', [
            'jobSeeker' => $this->seekerDetails($user),
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
        $this->ensureJobSeeker($user);

        return Inertia::render('backend/Admin/JobSeekerEdit', [
            'jobSeeker' => $this->seekerDetails($user),
            'options' => $this->formOptions(),
        ]);
    }

    public function update(UpdateJobSeekerRequest $request, User $user): RedirectResponse
    {
        $this->ensureJobSeeker($user);

        $user->forceFill([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'phone' => $request->filled('phone') ? $request->string('phone')->toString() : null,
            'location' => $request->filled('location') ? $request->string('location')->toString() : null,
            'resume_status' => JobSeekerResumeStatus::from($request->string('resume_status')->toString()),
            'account_status' => JobSeekerAccountStatus::from($request->string('account_status')->toString()),
        ]);

        if ($request->filled('password')) {
            $user->password = $request->string('password')->toString();
        }

        $user->save();

        ActivityLogger::log(
            $user,
            ActivityAction::ProfileUpdated,
            'Job seeker details were updated by an administrator.',
            $request->user(),
        );

        return to_route('admin.job-seekers.show', $user)
            ->with('success', 'Job seeker updated successfully.');
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAccess($request);
        $this->ensureJobSeeker($user);
        abort_unless($user->account_status !== JobSeekerAccountStatus::Suspended, 403, 'This job seeker is already suspended.');

        $user->forceFill([
            'account_status' => JobSeekerAccountStatus::Suspended,
        ])->save();

        ActivityLogger::log(
            $user,
            ActivityAction::JobSeekerSuspended,
            'Job seeker account was suspended.',
            $request->user(),
        );

        return back()->with('success', 'Job seeker suspended successfully.');
    }

    public function reactivate(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAccess($request);
        $this->ensureJobSeeker($user);
        abort_unless($user->account_status === JobSeekerAccountStatus::Suspended, 403, 'Only suspended job seekers can be reactivated.');

        $user->forceFill([
            'account_status' => JobSeekerAccountStatus::Active,
        ])->save();

        ActivityLogger::log(
            $user,
            ActivityAction::JobSeekerReactivated,
            'Job seeker account was reactivated.',
            $request->user(),
        );

        return back()->with('success', 'Job seeker reactivated successfully.');
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorizeAccess($request);

        $seekersQuery = $this->filteredQuery(
            $request->string('status')->toString(),
            $request->string('location')->toString(),
            $request->string('search')->toString(),
        );

        $filename = 'job-seekers-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($seekersQuery): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Name',
                'Email',
                'Phone',
                'Location',
                'Applications',
                'Resume',
                'Status',
                'Registered',
            ]);

            $seekersQuery->each(function (User $seeker) use ($handle): void {
                fputcsv($handle, [
                    $seeker->name,
                    $seeker->email,
                    $seeker->phone,
                    $seeker->location,
                    0,
                    $seeker->resume_status?->label(),
                    $seeker->account_status?->label(),
                    $seeker->created_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function authorizeAccess(Request $request): void
    {
        abort_unless($request->user()?->canManageJobSeekers(), 403);
    }

    private function ensureJobSeeker(User $user): void
    {
        abort_unless($user->isJobSeeker(), 404);
    }

    /**
     * @return Builder<User>
     */
    private function filteredQuery(string $statusFilter, string $locationFilter, string $search): Builder
    {
        $seekersQuery = User::query()
            ->role(RoleName::JobSeeker->value)
            ->latest();

        $accountStatus = JobSeekerAccountStatus::fromFilter($statusFilter);

        if ($accountStatus instanceof JobSeekerAccountStatus) {
            $seekersQuery->where('account_status', $accountStatus);
        }

        if ($locationFilter !== '' && $locationFilter !== 'all') {
            if ($locationFilter === 'UAE') {
                $seekersQuery->where('location', 'like', '%UAE%');
            } else {
                $seekersQuery->where('location', $locationFilter);
            }
        }

        if ($search !== '') {
            $seekersQuery->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        return $seekersQuery;
    }

    /**
     * @return array<string, mixed>
     */
    private function seekerRow(User $seeker): array
    {
        $status = $seeker->account_status instanceof JobSeekerAccountStatus
            ? $seeker->account_status
            : JobSeekerAccountStatus::Active;

        return [
            'id' => $seeker->id,
            'name' => $seeker->name,
            'email' => $seeker->email,
            'phone' => $seeker->phone ?: '—',
            'location' => $seeker->location ?: '—',
            'applications' => 0,
            'resume' => $seeker->resume_status?->label() ?? 'Warning',
            'resume_value' => $seeker->resume_status?->value ?? JobSeekerResumeStatus::Warning->value,
            'date' => $seeker->created_at?->toDateString(),
            'status' => $status->label(),
            'status_value' => $status->value,
            'can_suspend' => $status !== JobSeekerAccountStatus::Suspended,
            'can_reactivate' => $status === JobSeekerAccountStatus::Suspended,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function seekerDetails(User $seeker): array
    {
        return [
            ...$this->seekerRow($seeker),
            'created_at' => $seeker->created_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
            'updated_at' => $seeker->updated_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
        ];
    }

    /**
     * @return array{total: int, active: int, suspended: int, inactive: int}
     */
    private function stats(): array
    {
        $base = User::query()->role(RoleName::JobSeeker->value);

        return [
            'total' => (clone $base)->count(),
            'active' => (clone $base)->where('account_status', JobSeekerAccountStatus::Active)->count(),
            'suspended' => (clone $base)->where('account_status', JobSeekerAccountStatus::Suspended)->count(),
            'inactive' => (clone $base)->where('account_status', JobSeekerAccountStatus::Inactive)->count(),
        ];
    }

    /**
     * @return array{locations: list<string>, statuses: list<array{value: string, label: string}>, resume_statuses: list<array{value: string, label: string}>}
     */
    private function formOptions(): array
    {
        $presetLocations = [
            'Dubai, UAE',
            'Abu Dhabi, UAE',
            'Sharjah, UAE',
            'Ajman, UAE',
            'Ras Al Khaimah, UAE',
            'Fujairah, UAE',
            'Umm Al Quwain, UAE',
            'Al Ain, UAE',
        ];

        $storedLocations = User::query()
            ->role(RoleName::JobSeeker->value)
            ->whereNotNull('location')
            ->where('location', '!=', '')
            ->distinct()
            ->orderBy('location')
            ->pluck('location')
            ->all();

        return [
            'locations' => collect([...$presetLocations, ...$storedLocations])->unique()->values()->all(),
            'statuses' => collect(JobSeekerAccountStatus::cases())->map(fn (JobSeekerAccountStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ])->values()->all(),
            'resume_statuses' => collect(JobSeekerResumeStatus::cases())->map(fn (JobSeekerResumeStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ])->values()->all(),
        ];
    }
}
