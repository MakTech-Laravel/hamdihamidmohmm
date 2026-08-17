<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
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
        $profile->setRelation('user', $user);

        $applications = JobApplication::query()
            ->where('job_seeker_id', $user?->id)
            ->with(['jobPost:id,title,employer_id', 'jobPost.employer:id,company_name,name'])
            ->latest()
            ->limit(5)
            ->get();

        $completion = $profile->exists ? $profile->completionPercent() : 0;

        return Inertia::render('backend/User/JobSeekerDashboard', [
            'first_name' => explode(' ', (string) $user?->name)[0] ?: 'there',
            'completion' => $completion,
            'stats' => [
                'total' => JobApplication::query()->where('job_seeker_id', $user?->id)->count(),
                'under_review' => JobApplication::query()
                    ->where('job_seeker_id', $user?->id)
                    ->where('status', JobApplicationStatus::UnderReview)
                    ->count(),
                'shortlisted' => JobApplication::query()
                    ->where('job_seeker_id', $user?->id)
                    ->where('status', JobApplicationStatus::Shortlisted)
                    ->count(),
                'completion' => $completion,
            ],
            'checklist' => $profile->checklist($user),
            'applications' => $applications->map(fn (JobApplication $application) => [
                'id' => $application->id,
                'title' => $application->jobPost?->title,
                'company' => $application->jobPost?->employer?->company_name
                    ?: $application->jobPost?->employer?->name,
                'status' => $application->status?->label(),
                'status_value' => $application->status?->value,
                'date' => $application->created_at?->format('M j, Y'),
            ]),
            'notifications' => $user?->notifications()->latest()->limit(5)->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'created_at' => $notification->created_at?->diffForHumans(),
                'read' => $notification->read_at !== null,
            ]) ?? [],
        ]);
    }
}
