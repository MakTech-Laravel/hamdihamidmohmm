<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Enums\JobTaxonomyType;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use App\Support\JobListingQuery;
use App\Support\PortalPreferences;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchJobs implements Tool
{
    use EncodesToolResults;

    private const MAX_RESULTS = 8;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Search the live job vacancies on the portal using the same filters as the public jobs page: '
            .'keyword (title, company or category), country, location (duty station), category (position area) '
            .'and employment type. Returns matching jobs with their links plus the available filter values.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $keyword = trim((string) ($request['keyword'] ?? ''));
        $country = trim((string) ($request['country'] ?? ''));
        $location = trim((string) ($request['location'] ?? ''));
        $category = trim((string) ($request['category'] ?? ''));
        $employmentType = trim((string) ($request['employment_type'] ?? ''));
        $limit = max(1, min(self::MAX_RESULTS, (int) ($request['limit'] ?? 5)));

        $query = JobListingQuery::apply(
            JobPost::query()
                ->active()
                ->with('employer:id,name,company_name,portal_preferences'),
            $keyword,
            $location,
            $category,
            $employmentType !== '' ? [$employmentType] : [],
            $country,
        );

        $total = (clone $query)->count();

        $jobs = $query->latest()
            ->limit($limit)
            ->get()
            ->map(fn (JobPost $job): array => [
                'title' => $job->title,
                'company' => $job->employer?->company_name ?: $job->employer?->name,
                'country' => JobListingQuery::displayLabel(JobTaxonomyType::Country, $job->country),
                'location' => JobListingQuery::displayLabel(JobTaxonomyType::DutyStation, $job->location),
                'category' => JobListingQuery::displayLabel(JobTaxonomyType::PositionArea, $job->category),
                'employment_type' => JobListingQuery::displayLabel(JobTaxonomyType::EmploymentType, $job->employment_type),
                'experience' => $job->experience_level,
                'salary' => $this->publicSalary($job),
                'closing_date' => $job->expires_at?->toDateString(),
                'url' => route('jobs.show', $job->slug, absolute: false),
            ])
            ->values()
            ->all();

        return $this->encode([
            'total_matches' => $total,
            'jobs' => $jobs,
            'browse_all_url' => route('jobs', array_filter([
                'search' => $keyword,
                'country' => $country,
                'location' => $location,
                'category' => $category,
                'type' => $employmentType,
            ]), absolute: false),
            'available_filters' => $this->availableFilters(),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'keyword' => $schema->string()->description('Free text such as a job title, skill, company or category.'),
            'country' => $schema->string()->description('Country name, e.g. "Sudan".'),
            'location' => $schema->string()->description('City or duty station name.'),
            'category' => $schema->string()->description('Position area / job category name.'),
            'employment_type' => $schema->string()->description('Employment type such as Full-time, Part-time, Contract, Internship or Remote.'),
            'limit' => $schema->integer()->min(1)->max(self::MAX_RESULTS)->description('How many jobs to return (max 8).'),
        ];
    }

    private function publicSalary(JobPost $job): ?string
    {
        if (! filled($job->salary_range) || $job->employer === null) {
            return null;
        }

        return PortalPreferences::for($job->employer)['privacy']['show_salary'] ? $job->salary_range : null;
    }

    /**
     * @return array<string, list<string>>
     */
    private function availableFilters(): array
    {
        return collect(JobTaxonomy::filterOptions())
            ->map(fn (array $options): array => collect($options)->pluck('label')->filter()->values()->all())
            ->all();
    }
}
