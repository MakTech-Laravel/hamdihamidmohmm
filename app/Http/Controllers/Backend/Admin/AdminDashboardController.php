<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $employerCount = User::query()->role(RoleName::Employer->value)->count();
        $jobSeekerCount = User::query()->role(RoleName::JobSeeker->value)->count();
        $adminCount = User::query()->role(RoleName::adminPanelValues())->count();
        $totalUsers = User::query()->count();

        $recentUsers = User::query()
            ->latest()
            ->limit(6)
            ->get(['id', 'name', 'email', 'role', 'created_at'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_label' => $user->role_label,
                'created_at' => $user->created_at?->diffForHumans(),
            ]);

        return Inertia::render('backend/Admin/AdminDashboard', [
            'stats' => [
                'total_employers' => $employerCount,
                'total_job_seekers' => $jobSeekerCount,
                'active_jobs' => 0,
                'pending_jobs' => 0,
                'applications_today' => 0,
                'monthly_revenue' => 0,
                'total_revenue' => 0,
                'pending_verifications' => 0,
                'total_users' => $totalUsers,
                'total_admins' => $adminCount,
            ],
            'quickStats' => [
                'active_sessions' => 1,
                'unread_alerts' => 4,
                'tasks_today' => 12,
            ],
            'recentUsers' => $recentUsers,
            'alerts' => [
                ['title' => '3 Payment Failures', 'tone' => 'danger', 'detail' => 'Retry failed card charges'],
                ['title' => 'Verification Backlog', 'tone' => 'warning', 'detail' => 'Employer documents awaiting review'],
                ['title' => 'Job Approval Queue', 'tone' => 'caution', 'detail' => 'New listings need moderation'],
                ['title' => 'API Latency Elevated', 'tone' => 'info', 'detail' => 'Monitor gateway response times'],
            ],
            'canCreateAdmins' => $request->user()?->canManageAdmins() === true,
            'firstName' => explode(' ', (string) $request->user()?->name)[0] ?? 'Admin',
        ]);
    }
}
