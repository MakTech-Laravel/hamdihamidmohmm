<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Models\ContentPage;
use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $employer = $request->user();

        $jobs = JobPost::query()
            ->where('employer_id', $employer?->id)
            ->withCount('applications')
            ->latest()
            ->get();

        $applications = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $employer?->id))
            ->with(['jobSeeker:id,name', 'jobPost:id,title'])
            ->latest()
            ->limit(6)
            ->get();

        return Inertia::render('backend/User/EmployerDashboard', [
            'stats' => [
                'total_jobs' => $jobs->count(),
                'active_jobs' => $jobs->filter(fn (JobPost $job) => $job->effectiveStatus() === JobPostStatus::Active)->count(),
                'total_applications' => $jobs->sum('applications_count'),
                'new_this_week' => JobApplication::query()
                    ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $employer?->id))
                    ->where('created_at', '>=', now()->startOfWeek())
                    ->count(),
            ],
            'package_label' => $employer?->package?->label(),
            'active_jobs' => $jobs->take(5)->map(fn (JobPost $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'location' => $job->location,
                'type' => $job->employment_type,
                'applications' => $job->applications_count,
                'expires_at' => $job->expires_at?->diffForHumans(),
            ]),
            'recent_applications' => $applications->map(fn (JobApplication $application) => [
                'id' => $application->id,
                'name' => $application->jobSeeker?->name,
                'job' => $application->jobPost?->title,
                'status' => $application->status?->label(),
                'date' => $application->created_at?->toFormattedDateString(),
            ]),
            'notifications' => $employer?->notifications()->latest()->limit(5)->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'created_at' => $notification->created_at?->diffForHumans(),
            ]),
            'announcements' => ContentPage::query()
                ->where('type', 'announcement')
                ->where('status', 'published')
                ->latest()
                ->limit(3)
                ->get(['id', 'title', 'body']),
            'first_name' => explode(' ', (string) $employer?->name)[0] ?: 'there',
        ]);
    }
}
