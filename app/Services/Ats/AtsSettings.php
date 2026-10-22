<?php

namespace App\Services\Ats;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AtsSettings
{
    public const MAX_BATCH_SIZE = 1000;

    /**
     * Whether ATS screening is switched on (config and admin platform switch).
     */
    public function enabled(): bool
    {
        return (bool) config('ai.ats.enabled', true)
            && PlatformSetting::atsScreening()['enabled'];
    }

    /**
     * Whether AI providers may be called. When false, the rule-based scorer is used.
     */
    public function aiEnabled(): bool
    {
        return $this->enabled()
            && (bool) config('ai.ats.ai_enabled', true)
            && PlatformSetting::atsScreening()['ai_enabled'];
    }

    public function enabledForEmployer(?User $employer): bool
    {
        return $employer !== null
            && $employer->ats_enabled !== false
            && $this->enabled();
    }

    public function batchSize(): int
    {
        return max(1, min(self::MAX_BATCH_SIZE, (int) config('ai.ats.batch_size', self::MAX_BATCH_SIZE)));
    }

    public function queue(): string
    {
        return (string) (config('ai.ats.queue') ?: 'default');
    }

    /**
     * Ordered failover list of AI providers.
     *
     * @return list<array{provider: string, model: string|null}>
     */
    public function providers(): array
    {
        $raw = (string) config('ai.ats.providers', '');
        $defaultModel = config('ai.ats.model') ?: null;
        $entries = collect(explode(',', $raw))
            ->map(fn (string $entry): string => trim($entry))
            ->filter()
            ->values();

        if ($entries->isEmpty()) {
            return [[
                'provider' => (string) config('ai.default', 'openai'),
                'model' => $defaultModel,
            ]];
        }

        return $entries
            ->map(function (string $entry, int $index) use ($defaultModel): array {
                $provider = Str::before($entry, ':');
                $model = Str::contains($entry, ':') ? trim(Str::after($entry, ':')) : null;

                return [
                    'provider' => trim($provider),
                    'model' => $model !== null && $model !== '' ? $model : ($index === 0 ? $defaultModel : null),
                ];
            })
            ->unique('provider')
            ->values()
            ->all();
    }

    /**
     * @return array{skills: int, experience: int, education: int}
     */
    public function weights(): array
    {
        $weights = (array) config('ai.ats.weights', []);

        return [
            'skills' => max(0, (int) ($weights['skills'] ?? 50)),
            'experience' => max(0, (int) ($weights['experience'] ?? 30)),
            'education' => max(0, (int) ($weights['education'] ?? 20)),
        ];
    }

    public function strongThreshold(): int
    {
        return (int) config('ai.ats.thresholds.strong', 75);
    }

    public function possibleThreshold(): int
    {
        return (int) config('ai.ats.thresholds.possible', 50);
    }

    public function shortlistSize(): int
    {
        return max(1, (int) config('ai.ats.shortlist_size', 5));
    }

    public function staleAfterMinutes(): int
    {
        return max(5, (int) config('ai.ats.stale_after_minutes', 30));
    }

    /**
     * Soft daily AI token budget. Zero means unlimited.
     */
    public function dailyTokenBudget(): int
    {
        return max(0, (int) config('ai.ats.daily_token_budget', 0));
    }

    public function tokensUsedToday(): int
    {
        return (int) Cache::get($this->dailyTokenCacheKey(), 0);
    }

    public function withinDailyTokenBudget(): bool
    {
        $budget = $this->dailyTokenBudget();

        return $budget === 0 || $this->tokensUsedToday() < $budget;
    }

    public function recordTokenUsage(int $inputTokens, int $outputTokens): void
    {
        $total = max(0, $inputTokens) + max(0, $outputTokens);

        if ($total === 0) {
            return;
        }

        $key = $this->dailyTokenCacheKey();

        if (! Cache::has($key)) {
            Cache::put($key, $total, now()->endOfDay());

            return;
        }

        Cache::increment($key, $total);
    }

    private function dailyTokenCacheKey(): string
    {
        return 'ats:tokens:'.now()->toDateString();
    }
}
