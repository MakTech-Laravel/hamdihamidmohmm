<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobTaxonomyType;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use App\Models\User;
use App\Support\JobListingQuery;
use App\Support\PortalPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerJobsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $search = $request->string('search')->toString();
        $country = $request->string('country')->toString();
        $location = $request->string('location')->toString();
        $category = $request->string('category')->toString();
        $types = collect($request->input('types', []))
            ->map(fn (mixed $type): string => trim((string) $type))
            ->filter()
            ->values()
            ->all();

        $appliedJobIds = JobApplication::query()
            ->where('job_seeker_id', $user?->id)
            ->pluck('job_post_id')
            ->all();

        $jobs = JobListingQuery::apply(
            JobPost::query()
                ->active()
                ->with('employer:id,name,company_name,company_logo_path,portal_preferences'),
            $search,
            $location,
            $category,
            $types,
            $country,
        )
            ->latest()
            ->paginate(30)
            ->withQueryString()
            ->through(function (JobPost $job) use ($appliedJobIds) {
                $company = $job->employer?->company_name ?: $job->employer?->name;

                return [
                    'id' => $job->id,
                    'slug' => $job->slug,
                    'title' => $job->title,
                    'company' => $company,
                    'initials' => $this->initials($company),
                    'logo_url' => $job->listingLogoUrl(),
                    'country' => JobListingQuery::displayLabel(JobTaxonomyType::Country, $job->country),
                    'location' => JobListingQuery::displayLabel(JobTaxonomyType::DutyStation, $job->location),
                    'type' => JobListingQuery::displayLabel(JobTaxonomyType::EmploymentType, $job->employment_type),
                    'category' => JobListingQuery::displayLabel(JobTaxonomyType::PositionArea, $job->category),
                    'salary' => $this->publicSalary($job->employer, $job->salary_range),
                    'closing_date' => $job->closingDateLabel(),
                    'applied' => in_array($job->id, $appliedJobIds, true),
                    'job_url' => $job->slug ? route('jobs.show', $job->slug) : null,
                ];
            });

        return Inertia::render('backend/User/JobSeekerJobs', [
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
