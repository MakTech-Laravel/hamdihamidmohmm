<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\User;
use App\Support\ApplicantDocumentDownloader;
use App\Support\ApplicantProfilePreview;
use App\Support\ExperienceFilterOptions;
use App\Support\JobSeekerResume;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationMonitoringController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $status = $request->string('status')->toString();
        $experience = $request->string('experience')->toString();
        $experienceSort = $request->string('experience_sort')->toString();

        $appsQuery = JobApplication::query()
            ->with([
                'jobPost:id,title,employer_id',
                'jobPost.employer:id,name,company_name',
                'jobSeeker',
                'jobSeeker.jobSeekerProfile',
            ]);

        if (JobApplicationStatus::tryFrom($status) instanceof JobApplicationStatus) {
            $appsQuery->where('status', $status);
        }

        ExperienceFilterOptions::applyRange($appsQuery, $experience);

        if (in_array($experienceSort, ['asc', 'desc'], true)) {
            ExperienceFilterOptions::applySort($appsQuery, $experienceSort);
        } else {
            $appsQuery->latest();
        }

        $applications = $appsQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn(JobApplication $application) => $this->row($application));

        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->startOfDay()->subDays($i);
            $trend[] = [
                'label' => $day->format('D'),
                'count' => JobApplication::query()->whereDate('created_at', $day->toDateString())->count(),
            ];
        }

        return Inertia::render('backend/Admin/ApplicationsMonitoring', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'experience' => $experience,
                'experience_sort' => in_array($experienceSort, ['asc', 'desc'], true) ? $experienceSort : '',
            ],
            'experience_options' => ExperienceFilterOptions::enabled(),
            'stats' => $this->stats(),
            'trend' => $trend,
        ]);
    }

    public function downloadResume(Request $request, JobApplication $application): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

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
        abort_unless($request->user()?->canManageJobs(), 403);

        return ApplicantDocumentDownloader::highestDegree(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadOtherDocument(Request $request, JobApplication $application): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        return ApplicantDocumentDownloader::otherDocument(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadCoverLetter(Request $request, JobApplication $application): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

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
        abort_unless($request->user()?->canManageJobs(), 403);

        return ApplicantDocumentDownloader::certification(
            ApplicantDocumentDownloader::seekerFromApplication($application),
            $index,
            $attachment ?? 0,
        );
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $filename = 'applications-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Seeker', 'Email', 'Job', 'Employer', 'Status', 'Applied']);

            JobApplication::query()->with(['jobSeeker', 'jobPost.employer'])->latest()->each(function (JobApplication $application) use ($handle): void {
                fputcsv($handle, [
                    $application->jobSeeker?->name,
                    $application->jobSeeker?->email,
                    $application->jobPost?->title,
                    $application->jobPost?->employer?->company_name,
                    $application->status?->label(),
                    $application->created_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobApplication $application): array
    {
        $seeker = $application->jobSeeker;
        $base = [
            'id' => $application->id,
            'seeker' => $seeker?->name,
            'email' => $seeker?->email,
            'job' => $application->jobPost?->title,
            'employer' => $application->jobPost?->employer?->company_name
                ?: $application->jobPost?->employer?->name,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'date' => $application->created_at?->toDateString(),
            'resume_url' => route('admin.applications.resume', $application),
            'timeline' => $this->formatTimeline($application->timeline()),
        ];

        if (! $seeker instanceof User) {
            return [
                ...$base,
                'preview' => [
                    'is_applicant' => true,
                    'name' => 'Applicant',
                    'title' => $application->jobPost?->title ?: 'Applicant',
                    'status' => $application->status?->label() ?: 'Applied',
                    'email' => '—',
                    'phone' => '—',
                    'location' => '—',
                    'skills' => [],
                    'education' => [],
                    'experience' => [],
                    'languages' => [],
                    'certifications' => [],
                    'cover_letter' => $application->cover_letter,
                    'resume_name' => null,
                    'resume_url' => $base['resume_url'],
                    'highest_degree_name' => null,
                    'highest_degree_url' => null,
                    'other_document_name' => null,
                    'other_document_url' => null,
                    'cover_letter_file_name' => null,
                    'cover_letter_file_url' => null,
                    'avatar_url' => null,
                    'timeline' => $base['timeline'],
                ],
            ];
        }

        $preview = ApplicantDocumentDownloader::withDownloadUrls(
            ApplicantProfilePreview::from($seeker, $application),
            $application,
            'admin',
        );

        return [
            ...$base,
            'preview' => [
                ...$preview,
                'is_applicant' => true,
                'status' => $application->status?->label() ?: JobApplicationStatus::Applied->label(),
                'title' => $preview['title'] !== 'Applicant'
                    ? $preview['title']
                    : ($application->jobPost?->title ?: 'Applicant'),
                'location' => $preview['preview_location'],
                'resume_url' => $base['resume_url'],
                'timeline' => $base['timeline'],
            ],
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

    /**
     * @return array{total: int, today: int, interviews: int, hired: int}
     */
    private function stats(): array
    {
        return [
            'total' => JobApplication::query()->count(),
            'today' => JobApplication::query()->whereDate('created_at', today())->count(),
            'interviews' => JobApplication::query()->where('status', JobApplicationStatus::Interview)->count(),
            'hired' => JobApplication::query()->where('status', JobApplicationStatus::Hired)->count(),
        ];
    }
}
