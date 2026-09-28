<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\JobPostStatus;
use App\Enums\JobTaxonomyType;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use App\Models\Package;
use App\Models\User;
use App\Support\JobListingQuery;
use App\Support\PortalPreferences;
use App\Support\TrainingMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FrontendController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('frontend/home', [
            'packages' => Package::publicCards(),
            'filterOptions' => JobTaxonomy::filterOptions(),
            'recommendedJobs' => JobPost::query()
                ->active()
                ->with('employer:id,name,company_name,company_logo_path,portal_preferences')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn(JobPost $job) => $this->homeJobCard($job))
                ->values(),
        ]);
    }

    public function jobs(Request $request): Response
    {
        $search = $request->string('search')->toString();

        if ($search === '' && $request->filled('title')) {
            $search = $request->string('title')->toString();
        }

        $country = $request->string('country')->toString();
        $location = $request->string('location')->toString();
        $category = $request->string('category')->toString();
        $types = collect($request->input('types', []))
            ->map(fn(mixed $type): string => trim((string) $type))
            ->filter()
            ->values()
            ->all();

        if ($types === [] && $request->filled('type')) {
            $types = [trim($request->string('type')->toString())];
        }

        $jobs = JobListingQuery::apply(
            JobPost::query()
                ->active()
                ->with('employer:id,name,company_name,company_logo_path,portal_preferences')
                ->withCount('applications'),
            $search,
            $location,
            $category,
            $types,
            $country,
        )
            ->latest()
            ->paginate(30)
            ->withQueryString()
            ->through(fn(JobPost $job) => [
                'id' => $job->id,
                'slug' => $job->slug,
                'title' => $job->title,
                'company' => $job->employer?->company_name ?: $job->employer?->name,
                'initials' => $this->initials($job->employer?->company_name ?: $job->employer?->name),
                'logo_url' => $this->jobListingLogoUrl($job),
                'country' => JobListingQuery::displayLabel(JobTaxonomyType::Country, $job->country),
                'location' => JobListingQuery::displayLabel(JobTaxonomyType::DutyStation, $job->location),
                'type' => JobListingQuery::displayLabel(JobTaxonomyType::EmploymentType, $job->employment_type),
                'category' => JobListingQuery::displayLabel(JobTaxonomyType::PositionArea, $job->category),
                'salary' => $this->publicSalary($job->employer, $job->salary_range),
                'closing_date' => $job->closingDateLabel(),
            ]);

        return Inertia::render('frontend/jobs', [
            'jobs' => $jobs,
            'filters' => [
                'search' => $search,
                'country' => $country,
                'location' => $location,
                'category' => $category,
                'types' => $types,
            ],
            'filterOptions' => JobTaxonomy::filterOptions(),
        ]);
    }

    public function jobShow(Request $request, JobPost $jobPost): Response
    {
        $isLive = $jobPost->effectiveStatus() === JobPostStatus::Active;
        $viewer = $request->user();
        $canPreview = $viewer !== null && (
            $viewer->isAdmin()
            || ($viewer->isEmployer() && $viewer->id === $jobPost->employer_id)
        );

        abort_unless($isLive || $canPreview, 404);

        if ($isLive) {
            $jobPost->incrementViews();
        }

        $jobPost->load('employer:id,name,company_name,company_logo_path,about,industry,website,portal_preferences');

        $applied = $request->user()?->isJobSeeker()
            ? JobApplication::query()
            ->where('job_post_id', $jobPost->id)
            ->where('job_seeker_id', $request->user()->id)
            ->exists()
            : false;

        return Inertia::render('frontend/job-show', [
            'job' => [
                'id' => $jobPost->id,
                'slug' => $jobPost->slug,
                'title' => $jobPost->title,
                'subtitle' => $jobPost->subtitle,
                'logo_url' => $this->jobListingLogoUrl($jobPost),
                'company' => $jobPost->employer?->company_name ?: $jobPost->employer?->name,
                'company_logo_url' => $jobPost->employer?->companyLogoUrl(),
                'initials' => $this->initials($jobPost->employer?->company_name ?: $jobPost->employer?->name),
                'location' => JobListingQuery::displayLabel(JobTaxonomyType::DutyStation, $jobPost->location),
                'type' => JobListingQuery::displayLabel(JobTaxonomyType::EmploymentType, $jobPost->employment_type),
                'category' => JobListingQuery::displayLabel(JobTaxonomyType::PositionArea, $jobPost->category),
                'country' => JobListingQuery::displayLabel(JobTaxonomyType::Country, $jobPost->country),
                'experience' => $jobPost->experience_level,
                'salary' => $this->publicSalary($jobPost->employer, $jobPost->salary_range),
                'posted' => $jobPost->created_at?->diffForHumans(),
                'deadline' => $jobPost->expires_at?->toDateString(),
                'description' => $jobPost->description,
                'overview' => $jobPost->description,
                'requirements' => $this->lines($jobPost->requirements),
                'skills' => array_values(array_filter(
                    is_array($jobPost->skills) ? $jobPost->skills : [],
                    fn(mixed $skill): bool => filled($skill),
                )),
                'about' => $jobPost->employer?->about,
                'industry' => $jobPost->employer?->industry,
                'company_industry' => $jobPost->employer?->industry,
                'company_about' => $jobPost->employer?->about,
                'company_website' => $jobPost->employer?->website,
                'similar' => JobPost::query()
                    ->active()
                    ->where('id', '!=', $jobPost->id)
                    ->with('employer:id,name,company_name,company_logo_path,portal_preferences')
                    ->latest()
                    ->limit(3)
                    ->get()
                    ->map(fn(JobPost $similar) => [
                        'slug' => $similar->slug,
                        'title' => $similar->title,
                        'company' => $similar->employer?->company_name ?: $similar->employer?->name,
                        'initials' => $this->initials($similar->employer?->company_name ?: $similar->employer?->name),
                        'logo_url' => $this->jobListingLogoUrl($similar),
                    ]),
            ],
            'applied' => $applied,
            'can_apply' => $isLive && $request->user()?->isJobSeeker() === true && ! $applied,
            'is_preview' => ! $isLive,
        ]);
    }

    public function pricing(): Response
    {
        return Inertia::render('frontend/pricing', [
            'packages' => Package::publicCards(),
        ]);
    }

    public function training(): Response
    {
        return Inertia::render('frontend/training', [
            'videos' => TrainingMedia::videos(),
            'heroVideoUrl' => TrainingMedia::heroVideoUrl(),
            'documents' => TrainingMedia::documents(),
        ]);
    }

    public function trainingVideo(string $video): BinaryFileResponse
    {
        $path = TrainingMedia::absolutePath($video);

        abort_if($path === null, 404);

        $stored = TrainingMedia::storedVideo($video);
        $mime = $stored['mime'] ?? null;

        return response()->file($path, [
            'Content-Type' => filled($mime) ? $mime : 'video/mp4',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=86400',
            'Content-Encoding' => 'identity',
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('frontend/about');
    }

    public function contact(): Response
    {
        return Inertia::render('frontend/contact');
    }

    /**
     * @return array<string, mixed>
     */
    private function homeJobCard(JobPost $job): array
    {
        $company = $job->employer?->company_name ?: $job->employer?->name;

        return [
            'slug' => $job->slug,
            'initials' => $this->initials($company),
            'logo_url' => $this->jobListingLogoUrl($job),
            'title' => $job->title,
            'company' => $company ?: 'Employer',
            'type' => JobListingQuery::displayLabel(JobTaxonomyType::EmploymentType, $job->employment_type) ?: 'Full-time',
            'location' => JobListingQuery::displayLabel(JobTaxonomyType::DutyStation, $job->location) ?: '—',
            'country' => JobListingQuery::displayLabel(JobTaxonomyType::Country, $job->country) ?: null,
            'experience' => $job->experience_level ?: '—',
            'posted' => $job->created_at?->diffForHumans() ?: '—',
            'salary' => $this->publicSalary($job->employer, $job->salary_range) ?: '—',
        ];
    }

    private function jobListingLogoUrl(JobPost $job): ?string
    {
        return $job->listingLogoUrl();
    }

    private function publicSalary(?User $employer, ?string $salary): ?string
    {
        if ($employer === null || ! filled($salary)) {
            return $salary;
        }

        $prefs = PortalPreferences::for($employer);

        return $prefs['privacy']['show_salary'] ? $salary : null;
    }

    private function initials(?string $name): string
    {
        $letters = preg_replace('/[^A-Za-z]/', '', (string) $name) ?: 'JP';

        return Str::upper(Str::substr($letters, 0, 2));
    }

    /**
     * @return list<string>
     */
    private function lines(?string $value): array
    {
        if (! filled($value)) {
            return [];
        }

        return collect(preg_split('/\r\n|\r|\n/', $value) ?: [])
            ->map(fn(string $line): string => trim($line))
            ->filter()
            ->values()
            ->all();
    }
}
