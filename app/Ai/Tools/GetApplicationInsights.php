<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Enums\JobApplicationStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetApplicationInsights implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get job application statistics: totals by status, applications received in the last N days and today, '
            .'the jobs with the most applicants and the latest applications.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $days = max(1, min(365, (int) ($request['days'] ?? 30)));

        $byStatus = JobApplication::query()
            ->toBase()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return $this->encode([
            'total' => (int) $byStatus->sum(),
            'by_status' => collect(JobApplicationStatus::cases())
                ->mapWithKeys(fn (JobApplicationStatus $status): array => [$status->label() => (int) ($byStatus[$status->value] ?? 0)])
                ->all(),
            'today' => JobApplication::query()->whereDate('created_at', today())->count(),
            "last_{$days}_days" => JobApplication::query()->where('created_at', '>=', now()->subDays($days))->count(),
            'top_jobs_by_applicants' => JobPost::query()
                ->withCount('applications')
                ->with('employer:id,name,company_name')
                ->orderByDesc('applications_count')
                ->limit(5)
                ->get()
                ->filter(fn (JobPost $job): bool => $job->applications_count > 0)
                ->map(fn (JobPost $job): array => [
                    'job' => $job->title,
                    'company' => $job->employer?->company_name ?: $job->employer?->name,
                    'applicants' => $job->applications_count,
                    'admin_url' => route('admin.jobs.show', $job, absolute: false),
                ])
                ->values()
                ->all(),
            'latest_applications' => JobApplication::query()
                ->with('jobPost:id,title', 'jobSeeker:id,name')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (JobApplication $application): array => [
                    'applicant' => $application->jobSeeker?->name,
                    'job' => $application->jobPost?->title,
                    'status' => $application->status?->label(),
                    'applied_at' => $application->created_at?->toDateTimeString(),
                ])
                ->values()
                ->all(),
            'admin_url' => route('admin.applications.index', absolute: false),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'days' => $schema->integer()->min(1)->max(365)->description('Look-back window in days for the period count (default 30).'),
        ];
    }
}
