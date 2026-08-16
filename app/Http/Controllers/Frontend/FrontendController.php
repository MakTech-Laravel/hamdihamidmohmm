<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FrontendController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('frontend/home');
    }

    public function jobs(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $jobs = JobPost::query()
            ->active()
            ->with('employer:id,name,company_name')
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
                'salary' => $job->salary_range,
                'featured' => $job->featured,
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
        $jobPost->load('employer:id,name,company_name,about,industry,website');

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
                'salary' => $jobPost->salary_range,
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
                    ->with('employer:id,name,company_name')
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
            'packages' => Package::query()->where('is_active', true)->orderBy('price')->get([
                'id', 'slug', 'name', 'price', 'currency', 'billing_period', 'job_credits', 'featured_credits',
            ]),
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

    private function initials(?string $name): string
    {
        $letters = preg_replace('/[^A-Za-z]/', '', (string) $name) ?: 'JP';

        return Str::upper(Str::substr($letters, 0, 2));
    }
}
