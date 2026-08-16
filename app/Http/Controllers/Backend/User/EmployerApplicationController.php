<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateEmployerApplicationRequest;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $appsQuery = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $request->user()?->id))
            ->with([
                'jobSeeker:id,name,email,location',
                'jobSeeker.jobSeekerProfile:id,user_id,experience,headline',
                'jobPost:id,title',
            ])
            ->latest();

        if (JobApplicationStatus::tryFrom($status) instanceof JobApplicationStatus) {
            $appsQuery->where('status', $status);
        }

        if ($search !== '') {
            $appsQuery->whereHas('jobSeeker', function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $applications = $appsQuery->get()->map(fn (JobApplication $application) => $this->row($application));

        $allForStats = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $request->user()?->id));

        return Inertia::render('backend/User/EmployerApplications', [
            'applications' => $applications,
            'filters' => ['status' => $status, 'search' => $search],
            'stats' => [
                'total' => (clone $allForStats)->count(),
                'new' => (clone $allForStats)->where('created_at', '>=', now()->startOfWeek())->count(),
                'shortlisted' => (clone $allForStats)->where('status', JobApplicationStatus::Shortlisted)->count(),
                'interview' => (clone $allForStats)->where('status', JobApplicationStatus::Interview)->count(),
            ],
            'statuses' => collect(JobApplicationStatus::cases())->map(fn (JobApplicationStatus $item) => [
                'value' => $item->value,
                'label' => $item->label(),
            ]),
        ]);
    }

    public function update(UpdateEmployerApplicationRequest $request, JobApplication $application): RedirectResponse
    {
        $application->forceFill([
            'status' => JobApplicationStatus::from($request->validated('status')),
        ])->save();

        return back()->with('success', 'Application updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobApplication $application): array
    {
        $next = $application->status?->next();

        return [
            'id' => $application->id,
            'name' => $application->jobSeeker?->name,
            'email' => $application->jobSeeker?->email,
            'location' => $application->jobSeeker?->location ?: '—',
            'job' => $application->jobPost?->title,
            'job_id' => $application->job_post_id,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'date' => $application->created_at?->format('M j, Y'),
            'experience' => $application->jobSeeker?->jobSeekerProfile?->experienceLabel() ?? '—',
            'cover_letter' => $application->cover_letter,
            'headline' => $application->jobSeeker?->jobSeekerProfile?->headline,
            'next_status' => $next?->value,
            'can_move' => $next instanceof JobApplicationStatus,
            'can_reject' => $application->status !== JobApplicationStatus::Withdrawn,
        ];
    }
}
