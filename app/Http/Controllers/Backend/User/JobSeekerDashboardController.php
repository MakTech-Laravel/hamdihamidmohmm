<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\ContentPage;
use App\Models\JobApplication;
use App\Models\JobSeekerProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $profile = $user?->jobSeekerProfile ?? new JobSeekerProfile;

        $applications = JobApplication::query()
            ->where('job_seeker_id', $user?->id)
            ->with(['jobPost:id,title,employer_id', 'jobPost.employer:id,company_name,name'])
            ->latest()
            ->limit(5)
            ->get();

        $completionChecks = [
            filled($profile->headline),
            filled($profile->bio),
            is_array($profile->skills) && $profile->skills !== [],
            is_array($profile->education) && $profile->education !== [],
            is_array($profile->experience) && $profile->experience !== [],
            is_array($profile->languages) && $profile->languages !== [],
            filled($user?->phone),
            filled($user?->location),
            $user?->resume_status !== null,
        ];
        $completion = (int) round((count(array_filter($completionChecks)) / count($completionChecks)) * 100);

        return Inertia::render('backend/User/JobSeekerDashboard', [
            'first_name' => explode(' ', (string) $user?->name)[0] ?: 'there',
            'completion' => $completion,
            'stats' => [
                'total' => JobApplication::query()->where('job_seeker_id', $user?->id)->count(),
                'active' => JobApplication::query()
                    ->where('job_seeker_id', $user?->id)
                    ->whereNotIn('status', [
                        JobApplicationStatus::Rejected,
                        JobApplicationStatus::Withdrawn,
                        JobApplicationStatus::Hired,
                    ])
                    ->count(),
                'interviews' => JobApplication::query()->where('job_seeker_id', $user?->id)->where('status', JobApplicationStatus::Interview)->count(),
                'offers' => JobApplication::query()->where('job_seeker_id', $user?->id)->where('status', JobApplicationStatus::Offer)->count(),
            ],
            'applications' => $applications->map(fn (JobApplication $application) => [
                'id' => $application->id,
                'title' => $application->jobPost?->title,
                'company' => $application->jobPost?->employer?->company_name,
                'status' => $application->status?->label(),
                'date' => $application->created_at?->toFormattedDateString(),
            ]),
            'notifications' => $user?->notifications()->latest()->limit(5)->get()->map(fn ($notification) => [
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
        ]);
    }
}
