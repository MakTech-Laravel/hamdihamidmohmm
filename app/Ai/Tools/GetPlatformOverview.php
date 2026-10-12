<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Http\Request as HttpRequest;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetPlatformOverview implements Tool
{
    use EncodesToolResults;

    public function __construct(public AdminDashboardService $dashboard) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get the live admin dashboard overview: totals for employers, job seekers, users and admins, '
            .'active / pending jobs, pending employer verifications, suspended accounts, applications today, '
            .'this month\'s revenue, package distribution, open alerts and the latest activity log entries.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $payload = $this->dashboard->payload(HttpRequest::create('/admin/dashboard'));

        return $this->encode([
            'generated_at' => now()->toDateTimeString(),
            'stats' => $payload['stats'],
            'active_sessions_last_15_minutes' => $payload['quickStats']['active_sessions'],
            'employer_packages' => collect($payload['packages'])
                ->map(fn (array $package): array => [
                    'package' => $package['label'],
                    'employers' => $package['count'],
                    'percent' => $package['percent'],
                ])
                ->values()
                ->all(),
            'alerts' => collect($payload['alerts'])
                ->map(fn (array $alert): array => [
                    'title' => $alert['title'],
                    'detail' => $alert['detail'],
                    'url' => $alert['href'],
                ])
                ->values()
                ->all(),
            'recent_activity' => $payload['activities'],
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
