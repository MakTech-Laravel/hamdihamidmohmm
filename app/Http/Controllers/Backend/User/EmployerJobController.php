<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreEmployerJobRequest;
use App\Http\Requests\Backend\User\UpdateEmployerJobRequest;
use App\Http\Requests\Backend\User\UploadEmployerJobLogoRequest;
use App\Models\JobPost;
use App\Models\User;
use App\Support\EmployerPlanSnapshot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmployerJobController extends Controller
{
    public function index(Request $request): Response
    {
        $employer = $request->user();

        $jobs = JobPost::query()
            ->where('employer_id', $employer?->id)
            ->withCount([
                'applications',
                'applications as new_applications_count' => fn ($query) => $query->where('created_at', '>=', now()->subDays(7)),
            ])
            ->latest()
            ->get()
            ->map(fn (JobPost $job) => $this->listRow($job));

        return Inertia::render('backend/User/EmployerJobs', [
            'jobs' => $jobs,
            'plan' => $employer ? EmployerPlanSnapshot::for($employer) : null,
            'stats' => [
                'total' => $jobs->count(),
                'active' => $jobs->where('status_value', JobPostStatus::Active->value)->count(),
                'draft' => $jobs->whereIn('status_value', [JobPostStatus::Draft->value, JobPostStatus::Pending->value])->count(),
                'expired' => $jobs->where('status_value', JobPostStatus::Expired->value)->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $employer = $request->user();

        return Inertia::render('backend/User/EmployerJobEditor', [
            'job' => null,
            'plan' => $employer ? EmployerPlanSnapshot::for($employer) : null,
            'company' => $employer ? $this->companySummary($employer) : null,
            'options' => $this->formOptions(),
        ]);
    }

    public function store(StoreEmployerJobRequest $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $publish = $request->boolean('publish', true);

        $creditError = $this->creditError($employer, $publish);

        if ($creditError !== null) {
            return back()->withErrors(['title' => $creditError]);
        }

        $job = JobPost::query()->create([
            ...$request->safe()->except(['publish', 'featured', 'logo']),
            'employer_id' => $employer->id,
            'featured' => false,
            'status' => $publish ? JobPostStatus::Pending : JobPostStatus::Draft,
            'expires_at' => $request->date('expires_at') ?? ($publish ? now()->addDays(30) : null),
        ]);

        $this->storeJobLogo($job, $request->file('logo'));

        return redirect()
            ->route('employer.jobs')
            ->with('success', $publish ? 'Job submitted for review.' : 'Draft saved.');
    }

    public function edit(Request $request, JobPost $job): Response
    {
        $this->authorizeJob($request, $job);

        $employer = $request->user();

        return Inertia::render('backend/User/EmployerJobEditor', [
            'job' => [
                'id' => $job->id,
                'title' => $job->title,
                'subtitle' => $job->subtitle,
                'slug' => $job->slug,
                'logo_url' => $job->hasLogo() ? $job->logoUrl() : null,
                'category' => $job->category,
                'location' => $job->location,
                'employment_type' => $job->employment_type,
                'experience_level' => $job->experience_level,
                'salary_range' => $job->salary_range,
                'description' => $job->description,
                'requirements' => $job->requirements,
                'skills' => $job->skills ?? [],
                'expires_at' => $job->expires_at?->toDateString(),
                'status' => $job->effectiveStatus()->value,
            ],
            'plan' => $employer ? EmployerPlanSnapshot::for($employer) : null,
            'company' => $employer ? $this->companySummary($employer) : null,
            'options' => $this->formOptions(),
        ]);
    }

    public function update(UpdateEmployerJobRequest $request, JobPost $job): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $publish = $request->boolean('publish', $job->status !== JobPostStatus::Draft);

        $creditError = $this->creditError(
            $employer,
            $publish && $job->status === JobPostStatus::Draft,
        );

        if ($creditError !== null) {
            return back()->withErrors(['title' => $creditError]);
        }

        $job->update([
            ...$request->safe()->except(['publish', 'featured', 'logo']),
            'featured' => false,
        ]);

        $this->storeJobLogo($job, $request->file('logo'));

        if ($publish && in_array($job->status, [JobPostStatus::Draft, JobPostStatus::Rejected], true)) {
            $job->forceFill([
                'status' => JobPostStatus::Pending,
                'rejection_reason' => null,
                'expires_at' => $job->expires_at ?? now()->addDays(30),
            ])->save();
        }

        return redirect()
            ->route('employer.jobs')
            ->with('success', 'Job updated.');
    }

    public function uploadLogo(UploadEmployerJobLogoRequest $request, JobPost $job): RedirectResponse
    {
        $this->authorizeJob($request, $job);
        $this->storeJobLogo($job, $request->file('logo'));

        return back()->with('success', 'Job logo updated.');
    }

    public function destroyLogo(Request $request, JobPost $job): RedirectResponse
    {
        $this->authorizeJob($request, $job);

        $job->deleteLogoFile();
        $job->forceFill(['logo_path' => null])->save();

        return back()->with('success', 'Job logo removed.');
    }

    public function duplicate(Request $request, JobPost $job): RedirectResponse
    {
        $this->authorizeJob($request, $job);

        $copy = $job->replicate(['slug', 'views', 'rejection_reason', 'expires_at']);
        $copy->forceFill([
            'title' => $job->title.' (Copy)',
            'slug' => Str::slug($job->title).'-'.Str::lower(Str::random(6)),
            'status' => JobPostStatus::Draft,
            'featured' => false,
            'views' => 0,
            'expires_at' => null,
        ])->save();

        return redirect()
            ->route('employer.jobs.edit', $copy)
            ->with('success', 'Job duplicated as a draft.');
    }

    public function pause(Request $request, JobPost $job): RedirectResponse
    {
        $this->authorizeJob($request, $job);

        abort_unless($job->effectiveStatus() === JobPostStatus::Active, 422);

        $job->forceFill(['status' => JobPostStatus::Draft])->save();

        return back()->with('success', 'Job paused.');
    }

    public function publish(Request $request, JobPost $job): RedirectResponse
    {
        $this->authorizeJob($request, $job);

        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $creditError = $this->creditError($employer, true, false);

        if ($creditError !== null) {
            return back()->withErrors(['title' => $creditError]);
        }

        $job->forceFill([
            'status' => JobPostStatus::Pending,
            'rejection_reason' => null,
            'expires_at' => $job->expires_at ?? now()->addDays(30),
        ])->save();

        return back()->with('success', 'Job submitted for review.');
    }

    public function destroy(Request $request, JobPost $job): RedirectResponse
    {
        $this->authorizeJob($request, $job);

        $job->delete();

        return back()->with('success', 'Job deleted.');
    }

    /**
     * @return array{
     *     id: int,
     *     title: string,
     *     logo_url: string|null,
     *     category: string|null,
     *     location: string|null,
     *     type: string|null,
     *     salary_range: string|null,
     *     status: string,
     *     status_value: string,
     *     applications: int,
     *     new_applications: int,
     *     views: int,
     *     expires_at: string|null,
     *     created_at: string|null
     * }
     */
    private function listRow(JobPost $job): array
    {
        return [
            'id' => $job->id,
            'title' => $job->title,
            'logo_url' => $job->hasLogo() ? $job->logoUrl() : null,
            'category' => $job->category,
            'location' => $job->location,
            'type' => $job->employment_type,
            'salary_range' => $job->salary_range,
            'status' => $job->effectiveStatus()->label(),
            'status_value' => $job->effectiveStatus()->value,
            'applications' => (int) $job->applications_count,
            'new_applications' => (int) $job->new_applications_count,
            'views' => (int) $job->views,
            'expires_at' => $job->expires_at?->toFormattedDateString(),
            'created_at' => $job->created_at?->toFormattedDateString(),
        ];
    }

    /**
     * @return array{categories: list<string>, types: list<string>, experience_levels: list<string>}
     */
    private function formOptions(): array
    {
        return [
            'categories' => [
                'Technology',
                'Design',
                'Marketing',
                'Finance',
                'Healthcare',
                'Construction',
                'Logistics',
                'Retail',
                'Other',
            ],
            'types' => ['Full-time', 'Part-time', 'Contract', 'Remote'],
            'experience_levels' => ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Director'],
        ];
    }

    /**
     * @return array{
     *     name: string,
     *     industry: string|null,
     *     about: string|null,
     *     website: string|null,
     *     initials: string,
     *     logo_url: string|null
     * }
     */
    private function companySummary(User $employer): array
    {
        $name = (string) ($employer->company_name ?: $employer->name ?: 'Company');

        return [
            'name' => $name,
            'industry' => $employer->industry,
            'about' => $employer->about,
            'website' => $employer->website,
            'initials' => collect(explode(' ', $name))
                ->filter()
                ->take(2)
                ->map(fn (string $part): string => Str::upper(Str::substr($part, 0, 1)))
                ->implode(''),
            'logo_url' => $employer->hasCompanyLogo() ? $employer->companyLogoUrl() : null,
        ];
    }

    private function storeJobLogo(JobPost $job, ?UploadedFile $logo): void
    {
        if ($logo === null) {
            return;
        }

        $job->deleteLogoFile();

        $path = $logo->store('job-logos/'.$job->employer_id, 'public');

        $job->forceFill([
            'logo_path' => $path,
        ])->save();
    }

    private function authorizeJob(Request $request, JobPost $job): void
    {
        abort_unless($job->employer_id === $request->user()?->id, 403);
    }

    private function creditError(User $employer, bool $needsJobCredit): ?string
    {
        $plan = EmployerPlanSnapshot::for($employer);

        if ($needsJobCredit && ! $plan['can_post_job']) {
            return 'You have no job credits remaining. Upgrade your plan to post more jobs.';
        }

        return null;
    }
}
