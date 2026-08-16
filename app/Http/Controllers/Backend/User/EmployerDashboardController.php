<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Support\EmployerPlanSnapshot;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $jobs = JobPost::query()
            ->where('employer_id', $employer->id)
            ->withCount('applications')
            ->latest()
            ->get();

        $applications = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $employer->id))
            ->with(['jobSeeker:id,name', 'jobPost:id,title'])
            ->latest()
            ->limit(4)
            ->get();

        $activeJobs = $jobs
            ->filter(fn (JobPost $job) => $job->effectiveStatus() === JobPostStatus::Active)
            ->take(3)
            ->values();

        return Inertia::render('backend/User/EmployerDashboard', [
            'stats' => [
                'total_jobs' => $jobs->count(),
                'active_jobs' => $jobs->filter(fn (JobPost $job) => $job->effectiveStatus() === JobPostStatus::Active)->count(),
                'total_applications' => $jobs->sum('applications_count'),
                'new_this_week' => JobApplication::query()
                    ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $employer->id))
                    ->where('created_at', '>=', now()->startOfWeek())
                    ->count(),
            ],
            'plan' => EmployerPlanSnapshot::for($employer),
            'active_jobs' => $activeJobs->map(fn (JobPost $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'location' => $job->location,
                'type' => $job->employment_type,
                'applications' => $job->applications_count,
                'expires_at' => $job->expires_at?->diffForHumans(),
                'days_left' => $job->expires_at
                    ? (int) max(0, now()->startOfDay()->diffInDays($job->expires_at->copy()->startOfDay(), false))
                    : null,
            ]),
            'recent_applications' => $applications->map(fn (JobApplication $application) => [
                'id' => $application->id,
                'name' => $application->jobSeeker?->name,
                'job' => $application->jobPost?->title,
                'status' => $application->status?->label(),
                'status_value' => $application->status?->value,
                'date' => $application->created_at?->toFormattedDateString(),
            ]),
            'notifications' => $employer->notifications()->latest()->limit(2)->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'category' => $notification->data['category'] ?? 'Applications',
                'created_at' => $notification->created_at?->diffForHumans(),
            ]),
            'first_name' => explode(' ', (string) ($employer->contact_name ?: $employer->name))[0] ?: 'there',
        ]);
    }
}
