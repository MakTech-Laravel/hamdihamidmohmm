<?php

namespace App\Services\Admin;

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobPostStatus;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    private const RANGES = ['7d', '30d', '90d', '12m'];

    private const PACKAGE_COLORS = [
        'starter' => '#0057c8',
        'professional' => '#3b82f6',
        'enterprise' => '#93c5fd',
        'premium' => '#e57124',
    ];

    /**
     * @return array<string, mixed>
     */
    public function payload(Request $request): array
    {
        $range = $this->normalizeRange($request->string('range')->toString());
        $now = CarbonImmutable::now();
        $currentMonthStart = $now->startOfMonth();
        $previousMonthStart = $currentMonthStart->subMonth();
        $chartFrom = $this->rangeStart($range, $now);
        $from = $chartFrom->lessThan($previousMonthStart) ? $chartFrom : $previousMonthStart;

        $roleCounts = $this->roleCounts();
        $employerStatuses = $this->groupedCounts('account_status', UserRole::Employer);
        $employerVerifications = $this->groupedCounts('verification_status', UserRole::Employer);
        $employerPackages = $this->groupedCounts('package', UserRole::Employer);
        $seekerStatuses = $this->groupedCounts('account_status', UserRole::JobSeeker);

        $totalEmployers = $this->roleTotal($roleCounts, UserRole::Employer);
        $totalJobSeekers = $this->roleTotal($roleCounts, UserRole::JobSeeker);
        $totalUsers = array_sum($roleCounts);
        $totalAdmins = User::query()->role(RoleName::adminPanelValues())->count();

        $activeEmployers = $this->statusTotal($employerStatuses, EmployerAccountStatus::Active->value);
        $pendingVerifications = $this->statusTotal($employerVerifications, EmployerVerificationStatus::Pending->value);
        $activeJobSeekers = $this->statusTotal($seekerStatuses, JobSeekerAccountStatus::Active->value);
        $suspendedAccounts = $this->statusTotal($employerStatuses, EmployerAccountStatus::Suspended->value)
            + $this->statusTotal($seekerStatuses, JobSeekerAccountStatus::Suspended->value);
        $suspendedEmployers = $this->statusTotal($employerStatuses, EmployerAccountStatus::Suspended->value);
        $suspendedSeekers = $this->statusTotal($seekerStatuses, JobSeekerAccountStatus::Suspended->value);

        $registrations = User::query()
            ->where('created_at', '>=', $from)
            ->get(['id', 'role', 'created_at']);

        $activeJobs = JobPost::query()->active()->count();
        $pendingJobs = JobPost::query()->where('status', JobPostStatus::Pending)->count();
        $applicationsToday = JobApplication::query()->whereDate('created_at', today())->count();
        $monthlyRevenue = (int) Payment::query()
            ->where('status', PaymentStatus::Completed)
            ->where('paid_at', '>=', $currentMonthStart)
            ->sum('amount');

        $alerts = $this->alerts($pendingVerifications, $suspendedSeekers, $suspendedEmployers, $pendingJobs);

        return [
            'stats' => [
                'total_employers' => $totalEmployers,
                'total_job_seekers' => $totalJobSeekers,
                'active_employers' => $activeEmployers,
                'pending_verifications' => $pendingVerifications,
                'active_job_seekers' => $activeJobSeekers,
                'suspended_accounts' => $suspendedAccounts,
                'total_users' => $totalUsers,
                'total_admins' => $totalAdmins,
                'active_jobs' => $activeJobs,
                'pending_jobs' => $pendingJobs,
                'applications_today' => $applicationsToday,
                'monthly_revenue' => $monthlyRevenue,
                'currency' => 'SGD',
            ],
            'trends' => [
                'total_employers' => $this->registrationTrend($registrations, UserRole::Employer, $currentMonthStart, $previousMonthStart),
                'total_job_seekers' => $this->registrationTrend($registrations, UserRole::JobSeeker, $currentMonthStart, $previousMonthStart),
                'active_employers' => $this->liveTrend(),
                'pending_verifications' => $this->liveTrend(),
                'active_job_seekers' => $this->liveTrend(),
                'suspended_accounts' => $this->liveTrend(),
                'total_users' => $this->registrationTrend($registrations, null, $currentMonthStart, $previousMonthStart),
                'total_admins' => $this->liveTrend(),
                'active_jobs' => $this->liveTrend(),
                'pending_jobs' => $this->liveTrend(),
                'applications_today' => $this->liveTrend(),
                'monthly_revenue' => $this->liveTrend(),
            ],
            'quickStats' => [
                'active_sessions' => $this->activeSessions(),
                'unread_alerts' => count($alerts),
                'tasks_today' => $pendingVerifications,
            ],
            'chart' => $this->chart($range, $registrations, $now),
            'packages' => $this->packages($employerPackages, $totalEmployers),
            'alerts' => $alerts,
            'activities' => $this->activities(),
            'canCreateAdmins' => $request->user()?->canManageAdmins() === true,
            'firstName' => explode(' ', (string) $request->user()?->name)[0] ?: 'Admin',
        ];
    }

    private function normalizeRange(string $range): string
    {
        return in_array($range, self::RANGES, true) ? $range : '12m';
    }

    private function rangeStart(string $range, CarbonImmutable $now): CarbonImmutable
    {
        return match ($range) {
            '7d' => $now->startOfDay()->subDays(6),
            '30d' => $now->startOfDay()->subDays(29),
            '90d' => $now->startOfDay()->subDays(89),
            default => $now->startOfMonth()->subMonths(11),
        };
    }

    /**
     * @return array<int, int>
     */
    private function roleCounts(): array
    {
        $counts = [];

        User::query()
            ->toBase()
            ->selectRaw('role, COUNT(*) as aggregate')
            ->groupBy('role')
            ->get()
            ->each(function (object $row) use (&$counts): void {
                $counts[(int) $row->role] = (int) $row->aggregate;
            });

        return $counts;
    }

    /**
     * @return array<string, int>
     */
    private function groupedCounts(string $column, UserRole $role): array
    {
        $allowed = ['account_status', 'verification_status', 'package'];

        abort_unless(in_array($column, $allowed, true), 500);

        $counts = [];

        User::query()
            ->toBase()
            ->where('role', $role->value)
            ->selectRaw("{$column}, COUNT(*) as aggregate")
            ->groupBy($column)
            ->get()
            ->each(function (object $row) use (&$counts, $column): void {
                $key = $row->{$column};

                if ($key === null || $key === '') {
                    return;
                }

                $counts[(string) $key] = (int) $row->aggregate;
            });

        return $counts;
    }

    /**
     * @param  array<int, int>  $roleCounts
     */
    private function roleTotal(array $roleCounts, UserRole $role): int
    {
        return $roleCounts[$role->value] ?? 0;
    }

    /**
     * @param  array<string, int>  $counts
     */
    private function statusTotal(array $counts, string $status): int
    {
        return $counts[$status] ?? 0;
    }

    /**
     * @param  Collection<int, User>  $registrations
     * @return array{label: string, up: bool}
     */
    private function registrationTrend(
        Collection $registrations,
        ?UserRole $role,
        CarbonImmutable $currentMonthStart,
        CarbonImmutable $previousMonthStart,
    ): array {
        $current = $registrations
            ->filter(fn (User $user): bool => $this->matchesRole($user, $role) && $user->created_at?->greaterThanOrEqualTo($currentMonthStart) === true)
            ->count();

        $previous = $registrations
            ->filter(fn (User $user): bool => $this->matchesRole($user, $role)
                && $user->created_at?->greaterThanOrEqualTo($previousMonthStart) === true
                && $user->created_at?->lessThan($currentMonthStart) === true)
            ->count();

        if ($previous === 0) {
            return [
                'label' => $current > 0 ? 'Live' : '—',
                'up' => $current > 0,
            ];
        }

        $delta = round((($current - $previous) / $previous) * 100, 1);
        $prefix = $delta > 0 ? '+' : '';

        return [
            'label' => $prefix.$delta.'%',
            'up' => $delta >= 0,
        ];
    }

    /**
     * @return array{label: string, up: bool}
     */
    private function liveTrend(): array
    {
        return [
            'label' => 'Live',
            'up' => true,
        ];
    }

    private function matchesRole(User $user, ?UserRole $role): bool
    {
        return $role === null || $user->role === $role;
    }

    /**
     * @param  Collection<int, User>  $registrations
     * @return array{range: string, labels: list<string>, employers: list<int>, job_seekers: list<int>}
     */
    private function chart(string $range, Collection $registrations, CarbonImmutable $now): array
    {
        $labels = [];
        $employers = [];
        $jobSeekers = [];

        if ($range === '12m') {
            for ($index = 11; $index >= 0; $index--) {
                $month = $now->startOfMonth()->subMonths($index);
                $key = $month->format('Y-m');
                $labels[] = $month->format('M');
                $employers[] = $this->countInPeriod($registrations, UserRole::Employer, fn (CarbonInterface $date): bool => $date->format('Y-m') === $key);
                $jobSeekers[] = $this->countInPeriod($registrations, UserRole::JobSeeker, fn (CarbonInterface $date): bool => $date->format('Y-m') === $key);
            }

            return [
                'range' => $range,
                'labels' => $labels,
                'employers' => $employers,
                'job_seekers' => $jobSeekers,
            ];
        }

        $days = match ($range) {
            '7d' => 7,
            '30d' => 30,
            default => 90,
        };

        for ($index = $days - 1; $index >= 0; $index--) {
            $day = $now->startOfDay()->subDays($index);
            $key = $day->toDateString();
            $labels[] = $day->format('M j');
            $employers[] = $this->countInPeriod($registrations, UserRole::Employer, fn (CarbonInterface $date): bool => $date->toDateString() === $key);
            $jobSeekers[] = $this->countInPeriod($registrations, UserRole::JobSeeker, fn (CarbonInterface $date): bool => $date->toDateString() === $key);
        }

        return [
            'range' => $range,
            'labels' => $labels,
            'employers' => $employers,
            'job_seekers' => $jobSeekers,
        ];
    }

    /**
     * @param  Collection<int, User>  $registrations
     * @param  callable(CarbonInterface): bool  $matcher
     */
    private function countInPeriod(Collection $registrations, UserRole $role, callable $matcher): int
    {
        return $registrations
            ->filter(fn (User $user): bool => $user->role === $role && $user->created_at instanceof CarbonInterface && $matcher($user->created_at))
            ->count();
    }

    /**
     * @param  array<string, int>  $packageCounts
     * @return list<array{value: string, label: string, count: int, percent: int, color: string}>
     */
    private function packages(array $packageCounts, int $totalEmployers): array
    {
        return collect(EmployerPackage::cases())->map(function (EmployerPackage $package) use ($packageCounts, $totalEmployers): array {
            $count = $packageCounts[$package->value] ?? 0;

            return [
                'value' => $package->value,
                'label' => $package->label(),
                'count' => $count,
                'percent' => $totalEmployers > 0 ? (int) round(($count / $totalEmployers) * 100) : 0,
                'color' => self::PACKAGE_COLORS[$package->value],
            ];
        })->values()->all();
    }

    /**
     * @return list<array{title: string, tone: string, detail: string, href: string}>
     */
    private function alerts(int $pendingVerifications, int $suspendedSeekers, int $suspendedEmployers, int $pendingJobs = 0): array
    {
        $alerts = [];

        if ($pendingJobs > 0) {
            $alerts[] = [
                'title' => $pendingJobs === 1
                    ? '1 job waiting for review'
                    : "{$pendingJobs} jobs waiting for review",
                'tone' => 'info',
                'detail' => 'Approve or reject pending job posts.',
                'href' => '/admin/jobs?status=pending',
            ];
        }

        if ($pendingVerifications > 0) {
            $alerts[] = [
                'title' => $pendingVerifications === 1
                    ? '1 pending employer verification'
                    : "{$pendingVerifications} pending employer verifications",
                'tone' => 'warning',
                'detail' => 'Review employer documents and approve or reject accounts.',
                'href' => '/admin/employers?status=pending',
            ];
        }

        if ($suspendedSeekers > 0) {
            $alerts[] = [
                'title' => $suspendedSeekers === 1
                    ? '1 suspended job seeker'
                    : "{$suspendedSeekers} suspended job seekers",
                'tone' => 'danger',
                'detail' => 'Review suspended candidate accounts.',
                'href' => '/admin/job-seekers?status=suspended',
            ];
        }

        if ($suspendedEmployers > 0) {
            $alerts[] = [
                'title' => $suspendedEmployers === 1
                    ? '1 suspended employer'
                    : "{$suspendedEmployers} suspended employers",
                'tone' => 'caution',
                'detail' => 'Review suspended employer accounts.',
                'href' => '/admin/employers?status=suspended',
            ];
        }

        return $alerts;
    }

    /**
     * @return list<array{id: int, action_label: string, description: string, subject_name: string, actor_name: string|null, created_at: string|null}>
     */
    private function activities(): array
    {
        return ActivityLog::query()
            ->with(['user:id,name', 'actor:id,name'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (ActivityLog $log): array => [
                'id' => $log->id,
                'action_label' => $log->action->label(),
                'description' => $log->description,
                'subject_name' => $log->user?->name ?? 'Unknown',
                'actor_name' => $log->actor?->name,
                'created_at' => $log->created_at?->timezone(config('app.timezone'))->diffForHumans(),
            ])
            ->values()
            ->all();
    }

    private function activeSessions(): int
    {
        if (config('session.driver') !== 'database') {
            return 1;
        }

        return DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', now()->subMinutes(15)->timestamp)
            ->count();
    }
}
