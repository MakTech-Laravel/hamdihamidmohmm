<?php

namespace App\Services\Ats;

use App\Ai\Agents\ApplicationScreener;
use App\Enums\AtsRecommendation;
use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Models\JobApplication;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Ai\Exceptions\FailoverableException;
use Laravel\Ai\Files\Document;
use RuntimeException;
use Throwable;

class ApplicationScreeningService
{
    private const RUN_LOCK_SECONDS = 300;

    private const LIST_LIMIT = 10;

    private const ITEM_LIMIT = 160;

    private const REASON_LIMIT = 600;

    private const SUMMARY_LIMIT = 1200;

    public function __construct(
        private AtsSettings $settings,
        private AtsInputBuilder $inputBuilder,
        private RuleBasedApplicationScorer $rules,
    ) {}

    /**
     * Score one application against its job. AI provider errors never escape: the rule-based scorer takes over.
     */
    public function screen(JobApplication $application, bool $force = false): JobApplication
    {
        $application->loadMissing('jobPost.employer');
        $job = $application->jobPost;

        if ($job === null || ! $this->settings->enabledForEmployer($job->employer)) {
            if ($application->ai_status?->isInFlight()) {
                $this->persist($application, ['ai_status' => null]);
            }

            return $application;
        }

        $jobContext = $this->inputBuilder->jobContext($job);
        $cv = $this->inputBuilder->cvDocument($application);

        if ($cv === null) {
            return $this->persist($application, [
                ...$this->clearedResult(),
                'ai_status' => AtsScreeningStatus::NoCv,
                'ai_input_hash' => null,
                'ai_scored_at' => now(),
            ]);
        }

        $inputHash = $this->inputBuilder->inputHash($jobContext, $cv);
        $aiAllowed = $this->settings->aiEnabled();

        if (! $force && $this->isUpToDate($application, $inputHash, $aiAllowed)) {
            return $application;
        }

        $lock = Cache::lock('ats:screen:'.$application->id, self::RUN_LOCK_SECONDS);

        if (! $lock->get()) {
            return $application;
        }

        try {
            $this->persist($application, ['ai_status' => AtsScreeningStatus::Processing]);

            return $this->evaluate($application, $jobContext, $cv, $inputHash, $aiAllowed);
        } catch (Throwable $exception) {
            $this->persist($application, [
                'ai_status' => AtsScreeningStatus::Failed,
                'ai_error' => Str::limit($exception->getMessage(), 250),
            ]);

            throw $exception;
        } finally {
            $lock->release();
        }
    }

    /**
     * Mark an application as failed after the queue gave up on it.
     */
    public function markFailed(JobApplication $application, ?Throwable $exception = null): void
    {
        $this->persist($application, [
            'ai_status' => AtsScreeningStatus::Failed,
            'ai_error' => Str::limit($exception?->getMessage() ?: 'Screening could not be completed.', 250),
        ]);
    }

    /**
     * @param  array<string, mixed>  $jobContext
     * @param  array{path: string, extension: string, original_name: string, text: string, readable: bool, file_hash: string}  $cv
     */
    private function evaluate(JobApplication $application, array $jobContext, array $cv, string $inputHash, bool $aiAllowed): JobApplication
    {
        $attachPdf = ! $cv['readable'] && $cv['extension'] === 'pdf';

        if (! $cv['readable'] && ! ($aiAllowed && $attachPdf)) {
            return $this->persist($application, [
                ...$this->clearedResult(),
                'ai_status' => AtsScreeningStatus::Unreadable,
                'ai_input_hash' => $inputHash,
                'ai_scored_at' => now(),
            ]);
        }

        $aiResult = $aiAllowed ? $this->evaluateWithAi($jobContext, $cv, $attachPdf) : null;
        $aiAttempted = $aiResult !== null;

        if ($aiResult !== null && $aiResult['evaluation'] !== null) {
            return $this->saveResult(
                $application,
                $aiResult['evaluation'],
                AtsScoreSource::Ai,
                $aiResult['model'],
                $inputHash,
                $jobContext,
                $aiResult,
                null,
            );
        }

        $aiError = $aiResult['error'] ?? null;

        if (! $cv['readable']) {
            return $this->persist($application, [
                ...$this->clearedResult(),
                'ai_status' => AtsScreeningStatus::Unreadable,
                'ai_error' => $aiError !== null ? Str::limit($aiError, 250) : null,
                'ai_input_hash' => $inputHash,
                'ai_attempts' => (int) $application->ai_attempts + 1,
                'ai_scored_at' => now(),
            ]);
        }

        return $this->saveResult(
            $application,
            $this->rules->evaluate($jobContext, $cv['text']),
            AtsScoreSource::Rules,
            'rules',
            $inputHash,
            $jobContext,
            $aiAttempted ? $aiResult : null,
            $aiError,
        );
    }

    /**
     * Try every configured provider in order. Returns null evaluation when all of them failed.
     *
     * @param  array<string, mixed>  $jobContext
     * @param  array{text: string, path: string, readable: bool}  $cv
     * @return array{evaluation: array<string, mixed>|null, model: string|null, error: string|null, input_tokens: int, output_tokens: int}
     */
    private function evaluateWithAi(array $jobContext, array $cv, bool $attachPdf): array
    {
        if (! $this->settings->withinDailyTokenBudget()) {
            return [
                'evaluation' => null,
                'model' => null,
                'error' => 'Daily AI token budget reached.',
                'input_tokens' => 0,
                'output_tokens' => 0,
            ];
        }

        $prompt = $this->prompt($jobContext, $cv['text'], $attachPdf);
        $attachments = $attachPdf ? [Document::fromStorage($cv['path'], 'local')] : [];
        $errors = [];
        $inputTokens = 0;
        $outputTokens = 0;

        foreach ($this->settings->providers() as $entry) {
            $label = $entry['provider'].($entry['model'] !== null ? ':'.$entry['model'] : '');

            try {
                $response = retry(
                    max(1, (int) config('ai.ats.attempts', 2)),
                    fn () => (new ApplicationScreener)->prompt($prompt, $attachments, $entry['provider'], $entry['model']),
                    fn (int $attempt): int => $attempt * 1000,
                    fn (Throwable $exception): bool => $exception instanceof FailoverableException,
                );

                $inputTokens += (int) ($response->usage->promptTokens ?? 0);
                $outputTokens += (int) ($response->usage->completionTokens ?? 0);
                $this->settings->recordTokenUsage(
                    (int) ($response->usage->promptTokens ?? 0),
                    (int) ($response->usage->completionTokens ?? 0),
                );

                $evaluation = $this->sanitizeEvaluation($this->structuredOutput($response));

                if ($evaluation === null) {
                    throw new RuntimeException('The AI response did not match the expected format.');
                }

                return [
                    'evaluation' => $evaluation,
                    'model' => Str::limit($label, 100, ''),
                    'error' => null,
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                ];
            } catch (Throwable $exception) {
                report($exception);
                $errors[] = $entry['provider'].': '.Str::limit($exception->getMessage(), 120);
            }
        }

        return [
            'evaluation' => null,
            'model' => null,
            'error' => $errors === [] ? 'No AI provider is configured.' : implode(' | ', $errors),
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function structuredOutput(mixed $response): array
    {
        if ($response instanceof Arrayable) {
            return (array) $response->toArray();
        }

        $decoded = json_decode((string) ($response->text ?? ''), true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Validate and clamp an evaluation so bad provider output can never be stored.
     *
     * @param  array<string, mixed>  $output
     * @return array<string, mixed>|null
     */
    private function sanitizeEvaluation(array $output): ?array
    {
        foreach (['skills_score', 'experience_score', 'education_score'] as $key) {
            if (! isset($output[$key]) || ! is_numeric($output[$key])) {
                return null;
            }
        }

        if (! is_string($output['summary'] ?? null) || trim($output['summary']) === '') {
            return null;
        }

        return [
            'skills_score' => $this->clampScore($output['skills_score']),
            'matched_skills' => $this->stringList($output['matched_skills'] ?? []),
            'missing_skills' => $this->stringList($output['missing_skills'] ?? []),
            'experience_score' => $this->clampScore($output['experience_score']),
            'experience_reason' => Str::limit(trim((string) ($output['experience_reason'] ?? '')), self::REASON_LIMIT),
            'education_score' => $this->clampScore($output['education_score']),
            'education_reason' => Str::limit(trim((string) ($output['education_reason'] ?? '')), self::REASON_LIMIT),
            'strengths' => $this->stringList($output['strengths'] ?? []),
            'gaps' => $this->stringList($output['gaps'] ?? []),
            'summary' => Str::limit(trim($output['summary']), self::SUMMARY_LIMIT),
            'ai_recommendation' => AtsRecommendation::tryFrom((string) ($output['recommendation'] ?? ''))?->value,
        ];
    }

    /**
     * @param  array<string, mixed>  $evaluation
     * @param  array<string, mixed>  $jobContext
     * @param  array{input_tokens: int, output_tokens: int}|null  $aiResult
     */
    private function saveResult(
        JobApplication $application,
        array $evaluation,
        AtsScoreSource $source,
        ?string $model,
        string $inputHash,
        array $jobContext,
        ?array $aiResult,
        ?string $aiError,
    ): JobApplication {
        $score = $this->weightedScore($evaluation);

        return $this->persist($application, [
            'ai_status' => AtsScreeningStatus::Completed,
            'ai_source' => $source,
            'ai_score' => $score,
            'ai_recommendation' => AtsRecommendation::fromScore(
                $score,
                $this->settings->strongThreshold(),
                $this->settings->possibleThreshold(),
            ),
            'ai_summary' => $evaluation['summary'],
            'ai_breakdown' => [
                ...$evaluation,
                'weights' => $this->settings->weights(),
                'job_hash' => $this->inputBuilder->jobHash($jobContext),
                'version' => AtsInputBuilder::VERSION,
            ],
            'ai_error' => $aiError !== null ? Str::limit($aiError, 250) : null,
            'ai_model' => $model,
            'ai_input_hash' => $inputHash,
            'ai_attempts' => (int) $application->ai_attempts + ($aiResult !== null ? 1 : 0),
            'ai_input_tokens' => (int) $application->ai_input_tokens + (int) ($aiResult['input_tokens'] ?? 0),
            'ai_output_tokens' => (int) $application->ai_output_tokens + (int) ($aiResult['output_tokens'] ?? 0),
            'ai_scored_at' => now(),
        ]);
    }

    /**
     * @param  array{skills_score: int, experience_score: int, education_score: int}  $evaluation
     */
    private function weightedScore(array $evaluation): int
    {
        $weights = $this->settings->weights();
        $total = array_sum($weights);

        if ($total <= 0) {
            return $this->clampScore(($evaluation['skills_score'] + $evaluation['experience_score'] + $evaluation['education_score']) / 3);
        }

        return $this->clampScore((
            $evaluation['skills_score'] * $weights['skills']
            + $evaluation['experience_score'] * $weights['experience']
            + $evaluation['education_score'] * $weights['education']
        ) / $total);
    }

    private function isUpToDate(JobApplication $application, string $inputHash, bool $aiAllowed): bool
    {
        return $application->ai_status === AtsScreeningStatus::Completed
            && $application->ai_input_hash === $inputHash
            && ($application->ai_source === AtsScoreSource::Ai || ! $aiAllowed);
    }

    /**
     * @param  array<string, mixed>  $jobContext
     */
    private function prompt(array $jobContext, string $cvText, bool $attachPdf): string
    {
        $cvBody = $attachPdf
            ? '(The CV is attached as a PDF document. Read it as the candidate CV.)'
            : str_replace([ApplicationScreener::CV_START, ApplicationScreener::CV_END], '', $cvText);

        $lines = [
            '## Job',
            'Title: '.($jobContext['title'] ?: 'Not specified'),
            'Category: '.($jobContext['category'] ?: 'Not specified'),
            'Experience level: '.($jobContext['experience_level'] ?: 'Not specified'),
            'Employment type: '.($jobContext['employment_type'] ?: 'Not specified'),
            'Location: '.($jobContext['location'] ?: 'Not specified'),
            'Required skills: '.($jobContext['skills'] !== [] ? implode(', ', $jobContext['skills']) : 'Not specified'),
            '',
            'Requirements:',
            $jobContext['requirements'] ?: 'Not specified',
            '',
            'Description:',
            $jobContext['description'] ?: 'Not specified',
            '',
            '## Candidate CV',
            ApplicationScreener::CV_START,
            $cvBody,
            ApplicationScreener::CV_END,
        ];

        return implode("\n", $lines);
    }

    /**
     * @return array<string, mixed>
     */
    private function clearedResult(): array
    {
        return [
            'ai_source' => null,
            'ai_score' => null,
            'ai_recommendation' => null,
            'ai_summary' => null,
            'ai_breakdown' => null,
            'ai_error' => null,
            'ai_model' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function persist(JobApplication $application, array $attributes): JobApplication
    {
        $application->forceFill($attributes);

        JobApplication::withoutTimestamps(fn () => $application->saveQuietly());

        return $application;
    }

    private function clampScore(mixed $value): int
    {
        return max(0, min(100, (int) round((float) $value)));
    }

    /**
     * @return list<string>
     */
    private function stringList(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return collect($items)
            ->filter(fn (mixed $item): bool => is_scalar($item) && trim((string) $item) !== '')
            ->map(fn (mixed $item): string => Str::limit(trim((string) $item), self::ITEM_LIMIT))
            ->unique()
            ->take(self::LIST_LIMIT)
            ->values()
            ->all();
    }
}
