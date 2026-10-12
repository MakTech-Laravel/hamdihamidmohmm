<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Enums\JobPostStatus;
use App\Models\JobPost;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetJobInsights implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get job post statistics: totals by status, live jobs, jobs waiting for admin review, '
            .'jobs closing within 7 days and the most viewed live jobs.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $byStatus = JobPost::query()
            ->toBase()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $summary = fn (JobPost $job): array => [
            'title' => $job->title,
            'company' => $job->employer?->company_name ?: $job->employer?->name,
            'created_at' => $job->created_at?->toDateString(),
            'closing_date' => $job->expires_at?->toDateString(),
            'views' => $job->views,
            'admin_url' => route('admin.jobs.show', $job, absolute: false),
        ];

        return $this->encode([
            'total' => (int) $byStatus->sum(),
            'by_status' => collect(JobPostStatus::cases())
                ->mapWithKeys(fn (JobPostStatus $status): array => [$status->label() => (int) ($byStatus[$status->value] ?? 0)])
                ->all(),
            'live_now' => JobPost::query()->active()->count(),
            'pending_review' => JobPost::query()
                ->where('status', JobPostStatus::Pending)
                ->with('employer:id,name,company_name')
                ->oldest()
                ->limit(10)
                ->get()
                ->map($summary)
                ->values()
                ->all(),
            'closing_within_7_days' => JobPost::query()
                ->active()
                ->whereBetween('expires_at', [now(), now()->addDays(7)])
                ->with('employer:id,name,company_name')
                ->orderBy('expires_at')
                ->limit(10)
                ->get()
                ->map($summary)
                ->values()
                ->all(),
            'most_viewed_live_jobs' => JobPost::query()
                ->active()
                ->with('employer:id,name,company_name')
                ->orderByDesc('views')
                ->limit(5)
                ->get()
                ->map($summary)
                ->values()
                ->all(),
            'admin_url' => route('admin.jobs.index', absolute: false),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
