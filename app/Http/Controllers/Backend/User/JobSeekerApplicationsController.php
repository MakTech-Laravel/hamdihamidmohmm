<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreJobApplicationRequest;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerCv;
use App\Support\PortalNotifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            ->map(fn(JobApplication $application) => $this->row($application));

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
            'filters' => collect([
                JobApplicationStatus::Applied,
                JobApplicationStatus::UnderReview,
                JobApplicationStatus::Shortlisted,
                JobApplicationStatus::Interview,
                JobApplicationStatus::Offer,
                JobApplicationStatus::Hired,
                JobApplicationStatus::Rejected,
                JobApplicationStatus::Withdrawn,
            ])->map(fn(JobApplicationStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'count' => $applications->where('status_value', $status->value)->count(),
            ])->values(),
        ]);
    }

    public function store(StoreJobApplicationRequest $request, JobPost $jobPost): RedirectResponse
    {
        abort_unless($jobPost->effectiveStatus() === JobPostStatus::Active, 403);

        $user = $request->user();
        $payload = [
            'status' => JobApplicationStatus::Applied,
            'cover_letter' => $request->string('cover_letter')->toString() ?: null,
        ];

        if ($request->hasFile('resume')) {
            $resume = $request->file('resume');
            $userId = $user?->id ?? 0;
            $payload['resume_path'] = $resume->store('resumes/' . $userId, 'local');
            $payload['resume_original_name'] = $resume->getClientOriginalName();
        } elseif ($user !== null) {
            $selectedCv = null;

            if ($request->filled('cv_id')) {
                $selectedCv = JobSeekerCv::query()
                    ->where('user_id', $user->id)
                    ->whereKey($request->integer('cv_id'))
                    ->first();
            } else {
                $selectedCv = JobSeekerCv::query()
                    ->where('user_id', $user->id)
                    ->orderByDesc('is_default')
                    ->orderByDesc('id')
                    ->first();
            }

            $source = null;
            $originalName = null;

            if ($selectedCv instanceof JobSeekerCv && $selectedCv->fileExists()) {
                $source = (string) $selectedCv->file_path;
                $originalName = $selectedCv->original_name ?: basename($source);
            } elseif (
                filled($user->resume_path)
                && Storage::disk('local')->exists((string) $user->resume_path)
            ) {
                $source = (string) $user->resume_path;
                $originalName = $user->resume_original_name ?: basename($source);
            }

            if ($source !== null) {
                $extension = pathinfo($source, PATHINFO_EXTENSION) ?: 'pdf';
                $copyPath = 'resumes/' . $user->id . '/application-' . uniqid('', true) . '.' . $extension;

                Storage::disk('local')->copy($source, $copyPath);

                $payload['resume_path'] = $copyPath;
                $payload['resume_original_name'] = $originalName;
            }
        }

        $application = JobApplication::query()->firstOrCreate(
            [
                'job_post_id' => $jobPost->id,
                'job_seeker_id' => $request->user()?->id,
            ],
            $payload,
        );

        if ($application->wasRecentlyCreated) {
            $jobPost->loadMissing('employer');
            $employer = $jobPost->employer;
            $seeker = $request->user();

            if ($employer !== null && $seeker !== null) {
                PortalNotifier::newApplication(
                    $employer,
                    $seeker->name,
                    (string) $jobPost->title,
                );
            }

            if ($seeker !== null) {
                $company = $jobPost->employer?->company_name
                    ?: $jobPost->employer?->name
                    ?: 'the employer';

                PortalNotifier::applicationSubmitted(
                    $seeker,
                    (string) $jobPost->title,
                    (string) $company,
                );
            }
        }

        return redirect()
            ->route('job-seeker.dashboard')
            ->with('success', 'application_submitted');
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
            'slug' => $application->jobPost?->slug,
            'job_url' => $application->jobPost?->slug
                ? route('jobs.show', $application->jobPost->slug)
                : null,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'progress' => min($application->status?->progress() ?? 1, 5),
            'applied_at' => $application->created_at?->format('M j, Y'),
            'can_withdraw' => $application->status?->canWithdraw() === true,
            'timeline' => $application->timeline(),
        ];
    }
}
