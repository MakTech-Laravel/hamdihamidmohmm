<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateEmployerApplicationRequest;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use App\Support\ApplicantDocumentDownloader;
use App\Support\ApplicantProfilePreview;
use App\Support\ExperienceFilterOptions;
use App\Support\JobSeekerResume;
use App\Support\PortalNotifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();
        $jobId = $request->integer('job_id');
        $experience = $request->string('experience')->toString();
        $experienceSort = $request->string('experience_sort')->toString();

        $appsQuery = JobApplication::query()
            ->whereHas('jobPost', fn($query) => $query->where('employer_id', $request->user()?->id))
            ->with([
                'jobSeeker',
                'jobSeeker.jobSeekerProfile',
                'jobPost:id,title',
            ]);

        if ($jobId > 0) {
            $appsQuery->where('job_post_id', $jobId);
        }

        if (JobApplicationStatus::tryFrom($status) instanceof JobApplicationStatus) {
            $appsQuery->where('status', $status);
        }

        if ($search !== '') {
            $appsQuery->whereHas('jobSeeker', function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        ExperienceFilterOptions::applyRange($appsQuery, $experience);

        if (in_array($experienceSort, ['asc', 'desc'], true)) {
            ExperienceFilterOptions::applySort($appsQuery, $experienceSort);
        } else {
            $appsQuery->latest();
        }

        $applications = $appsQuery->get()->map(fn(JobApplication $application) => $this->row($application));

        $allForStats = JobApplication::query()
            ->whereHas('jobPost', fn($query) => $query->where('employer_id', $request->user()?->id));

        if ($jobId > 0) {
            $allForStats->where('job_post_id', $jobId);
        }

        $jobTitle = null;

        if ($jobId > 0) {
            $jobTitle = JobPost::query()
                ->where('employer_id', $request->user()?->id)
                ->where('id', $jobId)
                ->value('title');
        }

        return Inertia::render('backend/User/EmployerApplications', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'job_id' => $jobId > 0 ? $jobId : null,
                'job_title' => $jobTitle,
                'experience' => $experience,
                'experience_sort' => in_array($experienceSort, ['asc', 'desc'], true) ? $experienceSort : '',
            ],
            'experience_options' => ExperienceFilterOptions::enabled(),
            'stats' => [
                'total' => (clone $allForStats)->count(),
                'new' => (clone $allForStats)->where('created_at', '>=', now()->startOfWeek())->count(),
                'shortlisted' => (clone $allForStats)->where('status', JobApplicationStatus::Shortlisted)->count(),
                'interview' => (clone $allForStats)->where('status', JobApplicationStatus::Interview)->count(),
            ],
            'statuses' => collect(JobApplicationStatus::cases())
                ->reject(fn(JobApplicationStatus $item) => $item === JobApplicationStatus::Withdrawn)
                ->map(fn(JobApplicationStatus $item) => [
                    'value' => $item->value,
                    'label' => $item->label(),
                ])
                ->values(),
        ]);
    }

    public function update(UpdateEmployerApplicationRequest $request, JobApplication $application): RedirectResponse
    {
        $status = JobApplicationStatus::from($request->validated('status'));

        $application->forceFill([
            'status' => $status,
        ])->save();

        $application->loadMissing(['jobSeeker', 'jobPost.employer']);

        if ($application->jobSeeker instanceof User) {
            $company = $application->jobPost?->employer?->company_name
                ?: $application->jobPost?->employer?->name
                ?: 'the employer';

            PortalNotifier::applicationStatusChanged(
                $application->jobSeeker,
                (string) ($application->jobPost?->title ?? 'your application'),
                $status,
                $company,
            );
        }

        return back()->with('success', 'Application updated.');
    }

    public function downloadResume(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        $seeker = ApplicantDocumentDownloader::seekerFromApplication($application);

        if (filled($application->resume_path) && Storage::disk('local')->exists($application->resume_path)) {
            $downloadName = $application->resume_original_name ?: basename($application->resume_path);

            return Storage::disk('local')->download($application->resume_path, $downloadName);
        }

        if (filled($seeker->resume_path) && Storage::disk('local')->exists((string) $seeker->resume_path)) {
            $downloadName = $seeker->resume_original_name ?: basename((string) $seeker->resume_path);

            return Storage::disk('local')->download((string) $seeker->resume_path, $downloadName);
        }

        return response()->streamDownload(function () use ($seeker): void {
            echo JobSeekerResume::pdf($seeker);
        }, JobSeekerResume::filename($seeker), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function downloadHighestDegree(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::highestDegree(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadOtherDocument(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::otherDocument(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadCoverLetter(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::coverLetter(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadCertification(
        Request $request,
        JobApplication $application,
        int $index,
        ?int $attachment = null,
    ): StreamedResponse {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::certification(
            ApplicantDocumentDownloader::seekerFromApplication($application),
            $index,
            $attachment ?? 0,
        );
    }

    private function authorizeEmployerApplication(Request $request, JobApplication $application): void
    {
        abort_unless($request->user()?->isEmployer() === true, 403);

        $application->loadMissing(['jobPost']);

        abort_unless($application->jobPost?->employer_id === $request->user()?->id, 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobApplication $application): array
    {
        $next = $application->status?->next();
        $seeker = $application->jobSeeker;

        if (! $seeker instanceof User) {
            return [
                'id' => $application->id,
                'name' => 'Applicant',
                'title' => 'Applicant',
                'headline' => null,
                'current_title' => null,
                'experience_years' => '—',
                'email' => '—',
                'phone' => '—',
                'location' => '—',
                'preview_location' => '—',
                'bio' => null,
                'linkedin_url' => null,
                'github_url' => null,
                'industry' => null,
                'expected_salary' => null,
                'availability' => [],
                'skills' => [],
                'education' => [],
                'experience' => [],
                'languages' => [],
                'certifications' => [],
                'cover_letter' => $application->cover_letter,
                'resume_name' => null,
                'has_resume_file' => false,
                'highest_degree_name' => null,
                'highest_degree_url' => null,
                'other_document_name' => null,
                'other_document_url' => null,
                'cover_letter_file_name' => null,
                'cover_letter_file_url' => null,
                'avatar_url' => null,
                'job' => $application->jobPost?->title,
                'job_id' => $application->job_post_id,
                'status' => $application->status?->label(),
                'status_value' => $application->status?->value,
                'date' => $application->created_at?->format('M j, Y'),
                'resume_url' => route('employer.applications.resume', $application),
                'timeline' => $this->formatTimeline($application->timeline()),
                'next_status' => $next?->value,
                'can_move' => $next instanceof JobApplicationStatus,
                'can_reject' => $application->status !== JobApplicationStatus::Withdrawn
                    && $application->status !== JobApplicationStatus::Rejected,
            ];
        }

        $preview = ApplicantDocumentDownloader::withDownloadUrls(
            ApplicantProfilePreview::from($seeker, $application),
            $application,
            'employer',
        );

        return [
            ...$preview,
            'id' => $application->id,
            'job' => $application->jobPost?->title,
            'job_id' => $application->job_post_id,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'date' => $application->created_at?->format('M j, Y'),
            'resume_url' => route('employer.applications.resume', $application),
            'timeline' => $this->formatTimeline($application->timeline()),
            'next_status' => $next?->value,
            'can_move' => $next instanceof JobApplicationStatus,
            'can_reject' => $application->status !== JobApplicationStatus::Withdrawn
                && $application->status !== JobApplicationStatus::Rejected,
        ];
    }

    /**
     * @param  list<array{label: string, date: string|null, state: string}>  $steps
     * @return list<array{label: string, date: string|null, state: string}>
     */
    private function formatTimeline(array $steps): array
    {
        return array_map(function (array $step): array {
            return [
                'label' => $step['label'],
                'date' => $step['date'] !== null
                    ? Carbon::parse($step['date'])->format('M j')
                    : null,
                'state' => $step['state'],
            ];
        }, $steps);
    }
}
