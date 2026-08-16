<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\RejectJobPostRequest;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use App\Support\JobSeekerResume;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $statusFilter = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $jobsQuery = JobPost::query()
            ->with([
                'employer:id,name,company_name,email,phone',
                'latestApplication.jobSeeker:id,name,email,phone,location',
                'latestApplication.jobSeeker.jobSeekerProfile:id,user_id,headline,skills,experience',
            ])
            ->withCount('applications')
            ->latest();

        $status = JobPostStatus::fromFilter($statusFilter);

        if ($status instanceof JobPostStatus) {
            if ($status === JobPostStatus::Expired) {
                $jobsQuery->where(function ($query): void {
                    $query->where('status', JobPostStatus::Expired)
                        ->orWhere(function ($expired): void {
                            $expired->where('status', JobPostStatus::Active)
                                ->whereNotNull('expires_at')
                                ->where('expires_at', '<', now());
                        });
                });
            } else {
                $jobsQuery->where('status', $status);
            }
        }

        if ($search !== '') {
            $jobsQuery->where(function ($query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('employer', function ($employer) use ($search): void {
                        $employer->where('company_name', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        $jobs = $jobsQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (JobPost $job) => $this->row($job));

        return Inertia::render('backend/Admin/JobManagement', [
            'jobs' => $jobs,
            'filters' => ['status' => $statusFilter, 'search' => $search],
            'stats' => $this->stats(),
        ]);
    }

    public function show(Request $request, JobPost $jobPost): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobPost->load(['employer:id,name,company_name,email'])->loadCount('applications');

        return Inertia::render('backend/Admin/JobShow', [
            'job' => [
                ...$this->row($jobPost),
                'description' => $jobPost->description,
                'employment_type' => $jobPost->employment_type,
                'salary_range' => $jobPost->salary_range,
                'rejection_reason' => $jobPost->rejection_reason,
                'expires_at' => $jobPost->expires_at?->toDateString(),
                'employer_email' => $jobPost->employer?->email,
            ],
        ]);
    }

    public function approve(Request $request, JobPost $jobPost): RedirectResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobPost->forceFill([
            'status' => JobPostStatus::Active,
            'rejection_reason' => null,
        ])->save();

        return back()->with('success', 'Job approved.');
    }

    public function reject(RejectJobPostRequest $request, JobPost $jobPost): RedirectResponse
    {
        $jobPost->forceFill([
            'status' => JobPostStatus::Rejected,
            'rejection_reason' => $request->string('rejection_reason')->toString(),
        ])->save();

        return back()->with('success', 'Job rejected.');
    }

    public function downloadApplicantResume(Request $request, JobPost $jobPost, User $user): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);
        abort_unless($user->isJobSeeker(), 404);

        $application = JobApplication::query()
            ->where('job_post_id', $jobPost->id)
            ->where('job_seeker_id', $user->id)
            ->first();

        abort_unless($application instanceof JobApplication, 404);

        if (filled($application->resume_path) && Storage::disk('local')->exists($application->resume_path)) {
            $downloadName = $application->resume_original_name ?: basename($application->resume_path);

            return Storage::disk('local')->download($application->resume_path, $downloadName);
        }

        $user->loadMissing('jobSeekerProfile');

        return response()->streamDownload(function () use ($user): void {
            echo JobSeekerResume::pdf($user);
        }, JobSeekerResume::filename($user), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function feature(Request $request, JobPost $jobPost): RedirectResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobPost->forceFill(['featured' => ! $jobPost->featured])->save();

        return back()->with('success', $jobPost->featured ? 'Job featured.' : 'Feature removed.');
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $filename = 'jobs-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Title', 'Employer', 'Category', 'Location', 'Status', 'Applications', 'Views', 'Created']);

            JobPost::query()->with('employer')->withCount('applications')->latest()->each(function (JobPost $job) use ($handle): void {
                fputcsv($handle, [
                    $job->title,
                    $job->employer?->company_name ?: $job->employer?->name,
                    $job->category,
                    $job->location,
                    $job->effectiveStatus()->label(),
                    $job->applications_count,
                    $job->views,
                    $job->created_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobPost $job): array
    {
        $status = $job->effectiveStatus();

        return [
            'id' => $job->id,
            'title' => $job->title,
            'slug' => $job->slug,
            'employer' => $job->employer?->company_name ?: $job->employer?->name,
            'category' => $job->category ?: '—',
            'location' => $job->location ?: '—',
            'applications' => $job->applications_count ?? $job->applications()->count(),
            'views' => $job->views,
            'status' => $status->label(),
            'status_value' => $status->value,
            'featured' => $job->featured,
            'created' => $job->created_at?->toDateString(),
            'can_review' => $job->status === JobPostStatus::Pending,
            'preview' => $this->preview($job),
        ];
    }

    /**
     * @return array{
     *     name: string,
     *     title: string,
     *     status: string,
     *     email: string,
     *     phone: string,
     *     location: string,
     *     skills: list<string>,
     *     resume_url: string|null,
     *     timeline: list<array{label: string, date: string|null, state: string}>
     * }
     */
    private function preview(JobPost $job): array
    {
        $application = $this->latestApplication($job);

        if ($application instanceof JobApplication) {
            return $this->applicantPreview($application, $job);
        }

        return $this->jobPreview($job);
    }

    private function latestApplication(JobPost $job): ?JobApplication
    {
        if ($job->relationLoaded('latestApplication')) {
            $application = $job->latestApplication;

            return $application instanceof JobApplication ? $application : null;
        }

        return $job->latestApplication()
            ->with(['jobSeeker.jobSeekerProfile'])
            ->first();
    }

    /**
     * @return array{
     *     name: string,
     *     title: string,
     *     status: string,
     *     email: string,
     *     phone: string,
     *     location: string,
     *     skills: list<string>,
     *     resume_url: string|null,
     *     timeline: list<array{label: string, date: string|null, state: string}>
     * }
     */
    private function applicantPreview(JobApplication $application, JobPost $job): array
    {
        $seeker = $application->jobSeeker;
        $profile = $seeker?->jobSeekerProfile;
        $skills = is_array($profile?->skills) ? $profile->skills : [];
        $location = $this->locationLine($seeker?->location, $profile?->experience);

        return [
            'name' => $seeker?->name ?: 'Applicant',
            'title' => $profile?->headline ?: $job->title,
            'status' => $application->status?->label() ?: JobApplicationStatus::Applied->label(),
            'email' => $seeker?->email ?: '—',
            'phone' => $seeker?->phone ?: '—',
            'location' => $location,
            'skills' => array_values(array_filter(
                $skills,
                fn (mixed $skill): bool => is_string($skill) && $skill !== '',
            )),
            'resume_url' => $seeker instanceof User
                ? route('admin.jobs.applicant-resume', [$job, $seeker])
                : null,
            'timeline' => $this->formatTimeline($application->timeline()),
        ];
    }

    /**
     * @return array{
     *     name: string,
     *     title: string,
     *     status: string,
     *     email: string,
     *     phone: string,
     *     location: string,
     *     skills: list<string>,
     *     resume_url: string|null,
     *     timeline: list<array{label: string, date: string|null, state: string}>
     * }
     */
    private function jobPreview(JobPost $job): array
    {
        return [
            'name' => $job->title,
            'title' => $job->employer?->company_name ?: $job->employer?->name ?: 'Employer',
            'status' => $job->effectiveStatus()->label(),
            'email' => $job->employer?->email ?: '—',
            'phone' => $job->employer?->phone ?: '—',
            'location' => $job->location ?: '—',
            'skills' => array_values(array_filter([$job->category, $job->employment_type])),
            'resume_url' => null,
            'timeline' => $this->jobTimeline($job),
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
     * @return list<array{label: string, date: string|null, state: string}>
     */
    private function jobTimeline(JobPost $job): array
    {
        $current = $job->effectiveStatus();

        if (in_array($current, [JobPostStatus::Rejected, JobPostStatus::Draft], true)) {
            return [
                [
                    'label' => JobPostStatus::Pending->label(),
                    'date' => $job->created_at?->format('M j'),
                    'state' => 'done',
                ],
                [
                    'label' => $current->label(),
                    'date' => $job->updated_at?->format('M j'),
                    'state' => 'current',
                ],
            ];
        }

        $reached = false;
        $steps = [];

        foreach ([JobPostStatus::Pending, JobPostStatus::Active, JobPostStatus::Expired] as $status) {
            if ($status === $current) {
                $steps[] = [
                    'label' => $status->label(),
                    'date' => $job->updated_at?->format('M j'),
                    'state' => 'current',
                ];
                $reached = true;

                continue;
            }

            $steps[] = [
                'label' => $status->label(),
                'date' => $reached ? null : ($status === JobPostStatus::Pending ? $job->created_at?->format('M j') : null),
                'state' => $reached ? 'pending' : 'done',
            ];
        }

        return $steps;
    }

    private function locationLine(?string $location, mixed $experience): string
    {
        $place = filled($location) ? $location : '—';
        $years = $this->experienceYears($experience);

        if ($years === null) {
            return $place;
        }

        $suffix = $years === 1 ? '1 year' : $years.' years';

        return $place === '—' ? $suffix : $place.' · '.$suffix;
    }

    private function experienceYears(mixed $experience): ?int
    {
        if (! is_array($experience) || $experience === []) {
            return null;
        }

        $years = 0;

        foreach ($experience as $item) {
            if (! is_array($item)) {
                continue;
            }

            if (isset($item['years'])) {
                $years += (int) $item['years'];
            }
        }

        return $years > 0 ? $years : null;
    }

    /**
     * @return array{total: int, active: int, pending: int, rejected: int, expired: int, featured: int}
     */
    private function stats(): array
    {
        return [
            'total' => JobPost::query()->count(),
            'active' => JobPost::query()->active()->count(),
            'pending' => JobPost::query()->where('status', JobPostStatus::Pending)->count(),
            'rejected' => JobPost::query()->where('status', JobPostStatus::Rejected)->count(),
            'expired' => JobPost::query()
                ->where(function ($query): void {
                    $query->where('status', JobPostStatus::Expired)
                        ->orWhere(function ($expired): void {
                            $expired->where('status', JobPostStatus::Active)
                                ->whereNotNull('expires_at')
                                ->where('expires_at', '<', now());
                        });
                })
                ->count(),
            'featured' => JobPost::query()->where('featured', true)->count(),
        ];
    }
}
