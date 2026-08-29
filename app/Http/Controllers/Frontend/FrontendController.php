<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\User;
use App\Support\PortalPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FrontendController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('frontend/home', [
            'packages' => Package::publicCards(),
            'recommendedJobs' => JobPost::query()
                ->active()
                ->with('employer:id,name,company_name,portal_preferences')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (JobPost $job) => $this->homeJobCard($job))
                ->values(),
        ]);
    }

    public function jobs(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $jobs = JobPost::query()
            ->active()
            ->with('employer:id,name,company_name,portal_preferences')
            ->withCount('applications')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($builder) use ($search): void {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (JobPost $job) => [
                'id' => $job->id,
                'slug' => $job->slug,
                'title' => $job->title,
                'company' => $job->employer?->company_name ?: $job->employer?->name,
                'initials' => $this->initials($job->employer?->company_name ?: $job->employer?->name),
                'location' => $job->location,
                'type' => $job->employment_type,
                'category' => $job->category,
                'salary' => $this->publicSalary($job->employer, $job->salary_range),
            ]);

        return Inertia::render('frontend/jobs', [
            'jobs' => $jobs,
            'filters' => ['search' => $search],
        ]);
    }

    public function jobShow(Request $request, JobPost $jobPost): Response
    {
        abort_unless($jobPost->effectiveStatus()->value === 'active', 404);

        $jobPost->incrementViews();
        $jobPost->load('employer:id,name,company_name,about,industry,website,portal_preferences');

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
                'company' => $jobPost->employer?->company_name ?: $jobPost->employer?->name,
                'initials' => $this->initials($jobPost->employer?->company_name ?: $jobPost->employer?->name),
                'location' => $jobPost->location,
                'type' => $jobPost->employment_type,
                'category' => $jobPost->category,
                'salary' => $this->publicSalary($jobPost->employer, $jobPost->salary_range),
                'description' => $jobPost->description,
                'overview' => $jobPost->description,
                'about' => $jobPost->employer?->about,
                'industry' => $jobPost->employer?->industry,
                'company_industry' => $jobPost->employer?->industry,
                'company_about' => $jobPost->employer?->about,
                'company_website' => $jobPost->employer?->website,
                'similar' => JobPost::query()
                    ->active()
                    ->where('id', '!=', $jobPost->id)
                    ->with('employer:id,name,company_name,portal_preferences')
                    ->latest()
                    ->limit(3)
                    ->get()
                    ->map(fn (JobPost $similar) => [
                        'slug' => $similar->slug,
                        'title' => $similar->title,
                        'company' => $similar->employer?->company_name ?: $similar->employer?->name,
                        'initials' => $this->initials($similar->employer?->company_name ?: $similar->employer?->name),
                    ]),
            ],
            'applied' => $applied,
            'can_apply' => $request->user()?->isJobSeeker() === true && ! $applied,
        ]);
    }

    public function pricing(): Response
    {
        return Inertia::render('frontend/pricing', [
            'packages' => Package::publicCards(),
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
            'title' => $job->title,
            'company' => $company ?: 'Employer',
            'type' => $job->employment_type ?: 'Full-time',
            'location' => $job->location ?: '—',
            'experience' => $job->experience_level ?: '—',
            'posted' => $job->created_at?->diffForHumans() ?: '—',
            'salary' => $this->publicSalary($job->employer, $job->salary_range) ?: '—',
        ];
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
}
