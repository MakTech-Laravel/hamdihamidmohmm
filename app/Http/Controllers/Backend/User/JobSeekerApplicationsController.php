<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreJobApplicationRequest;
use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerApplicationsController extends Controller
{
    public function index(Request $request): Response
    {
        $applications = JobApplication::query()
            ->where('job_seeker_id', $request->user()?->id)
            ->with(['jobPost:id,title,location,employment_type,salary_range,slug,employer_id', 'jobPost.employer:id,name,company_name'])
            ->latest()
            ->get()
            ->map(fn (JobApplication $application) => $this->row($application));

        return Inertia::render('backend/User/JobSeekerApplications', [
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'active' => $applications->whereNotIn('status_value', [
                    JobApplicationStatus::Rejected->value,
                    JobApplicationStatus::Withdrawn->value,
                    JobApplicationStatus::Hired->value,
                ])->count(),
                'interviews' => $applications->where('status_value', JobApplicationStatus::Interview->value)->count(),
                'offers' => $applications->where('status_value', JobApplicationStatus::Offer->value)->count(),
            ],
        ]);
    }

    public function store(StoreJobApplicationRequest $request, JobPost $jobPost): RedirectResponse
    {
        abort_unless($jobPost->effectiveStatus() === JobPostStatus::Active, 403);

        JobApplication::query()->firstOrCreate(
            [
                'job_post_id' => $jobPost->id,
                'job_seeker_id' => $request->user()?->id,
            ],
            [
                'status' => JobApplicationStatus::Applied,
                'cover_letter' => $request->string('cover_letter')->toString() ?: null,
            ],
        );

        return back()->with('success', 'Application submitted.');
    }

    public function withdraw(Request $request, JobApplication $application): RedirectResponse
    {
        abort_unless($application->job_seeker_id === $request->user()?->id, 403);
        abort_unless($application->status?->canWithdraw() === true, 403);

        $application->forceFill(['status' => JobApplicationStatus::Withdrawn])->save();

        return back()->with('success', 'Application withdrawn.');
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobApplication $application): array
    {
        return [
            'id' => $application->id,
            'title' => $application->jobPost?->title,
            'company' => $application->jobPost?->employer?->company_name ?: $application->jobPost?->employer?->name,
            'location' => $application->jobPost?->location,
            'salary' => $application->jobPost?->salary_range,
            'type' => $application->jobPost?->employment_type,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'progress' => $application->status?->progress() ?? 1,
            'applied_at' => $application->created_at?->toFormattedDateString(),
            'can_withdraw' => $application->status?->canWithdraw() === true,
            'timeline' => $application->timeline(),
        ];
    }
}
