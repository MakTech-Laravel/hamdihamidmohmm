<?php

use App\Ai\Agents\ApplicationScreener;
use App\Enums\AtsRecommendation;
use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Models\JobApplication;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Ats\ApplicationScreeningService;
use App\Services\Ats\AtsInputBuilder;
use App\Services\Ats\AtsSettings;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Sleep;
use Laravel\Ai\Exceptions\ProviderOverloadedException;
use Laravel\Ai\Prompts\AgentPrompt;

beforeEach(function () {
    Storage::fake('local');
    Sleep::fake();

    config([
        'ai.ats.ai_enabled' => true,
        'ai.ats.providers' => 'openai',
        'ai.ats.attempts' => 2,
    ]);
});

function screenApplication(JobApplication $application, bool $force = false): JobApplication
{
    return app(ApplicationScreeningService::class)->screen($application, $force)->refresh();
}

test('a valid AI evaluation is stored with a weighted score calculated in PHP', function () {
    ApplicationScreener::fake([atsAiEvaluation()]);

    $application = screenApplication(atsApplication());

    expect($application->ai_status)->toBe(AtsScreeningStatus::Completed)
        ->and($application->ai_source)->toBe(AtsScoreSource::Ai)
        ->and($application->ai_score)->toBe(79)
        ->and($application->ai_recommendation)->toBe(AtsRecommendation::StrongMatch)
        ->and($application->ai_summary)->toContain('full stack developer')
        ->and($application->ai_breakdown['matched_skills'])->toBe(['React', 'TypeScript', 'Laravel'])
        ->and($application->ai_breakdown['missing_skills'])->toBe(['Docker'])
        ->and($application->ai_breakdown['job_hash'])->toBeString()
        ->and($application->ai_model)->toBe('openai')
        ->and($application->ai_attempts)->toBe(1)
        ->and($application->ai_error)->toBeNull()
        ->and($application->ai_scored_at)->not->toBeNull();
});

test('AI scores are clamped and the recommendation follows the final score', function () {
    ApplicationScreener::fake([atsAiEvaluation([
        'skills_score' => 140,
        'experience_score' => -20,
        'education_score' => 30,
        'recommendation' => 'strong_match',
    ])]);

    $application = screenApplication(atsApplication());

    expect($application->ai_breakdown['skills_score'])->toBe(100)
        ->and($application->ai_breakdown['experience_score'])->toBe(0)
        ->and($application->ai_score)->toBe(56)
        ->and($application->ai_recommendation)->toBe(AtsRecommendation::PossibleMatch);
});

test('invalid AI output falls back to the rule based scorer', function () {
    ApplicationScreener::fake([['summary' => '']]);

    $application = screenApplication(atsApplication());

    expect($application->ai_status)->toBe(AtsScreeningStatus::Completed)
        ->and($application->ai_source)->toBe(AtsScoreSource::Rules)
        ->and($application->ai_score)->toBe(88)
        ->and($application->ai_model)->toBe('rules')
        ->and($application->ai_error)->toContain('expected format')
        ->and($application->ai_breakdown['matched_skills'])->toBe(['React', 'TypeScript', 'Laravel'])
        ->and($application->ai_breakdown['missing_skills'])->toBe(['Docker'])
        ->and($application->ai_summary)->toContain('Basic keyword match');
});

test('daily token budget skips AI and falls back to rules', function () {
    config(['ai.ats.daily_token_budget' => 100]);
    app(AtsSettings::class)->recordTokenUsage(80, 30);
    ApplicationScreener::fake([atsAiEvaluation()]);

    $application = screenApplication(atsApplication());

    expect($application->ai_status)->toBe(AtsScreeningStatus::Completed)
        ->and($application->ai_source)->toBe(AtsScoreSource::Rules)
        ->and($application->ai_error)->toContain('Daily AI token budget reached');

    ApplicationScreener::assertNeverPrompted();
});

test('provider errors fall back to the rule based scorer and never throw', function () {
    ApplicationScreener::fake(fn () => throw new RuntimeException('Provider unreachable'));

    $application = screenApplication(atsApplication());

    expect($application->ai_status)->toBe(AtsScreeningStatus::Completed)
        ->and($application->ai_source)->toBe(AtsScoreSource::Rules)
        ->and($application->ai_error)->toContain('Provider unreachable')
        ->and($application->ai_attempts)->toBe(1);
});

test('overloaded providers are retried before giving up', function () {
    $calls = 0;

    ApplicationScreener::fake(function () use (&$calls) {
        $calls++;

        if ($calls === 1) {
            throw ProviderOverloadedException::forProvider('openai', 529);
        }

        return atsAiEvaluation();
    });

    $application = screenApplication(atsApplication());

    expect($calls)->toBe(2)
        ->and($application->ai_source)->toBe(AtsScoreSource::Ai);
});

test('a failing provider fails over to the next configured provider', function () {
    config(['ai.ats.providers' => 'openai,gemini:gemini-2.5-flash']);

    ApplicationScreener::fake(function (string $prompt, $attachments, $provider) {
        if ($provider->name() === 'openai') {
            throw new RuntimeException('OpenAI is down');
        }

        return atsAiEvaluation();
    });

    $application = screenApplication(atsApplication());

    expect($application->ai_source)->toBe(AtsScoreSource::Ai)
        ->and($application->ai_model)->toBe('gemini:gemini-2.5-flash')
        ->and($application->ai_error)->toBeNull();
});

test('applications without a CV are marked no_cv without a score', function () {
    ApplicationScreener::fake();

    $application = screenApplication(atsApplication(cvText: null));

    expect($application->ai_status)->toBe(AtsScreeningStatus::NoCv)
        ->and($application->ai_score)->toBeNull()
        ->and($application->ai_recommendation)->toBeNull();

    ApplicationScreener::assertNeverPrompted();
});

test('CVs without readable text are marked unreadable', function () {
    config(['ai.ats.ai_enabled' => false]);

    $application = screenApplication(atsApplication(cvText: '###'));

    expect($application->ai_status)->toBe(AtsScreeningStatus::Unreadable)
        ->and($application->ai_score)->toBeNull();
});

test('scanned PDFs are sent to the AI as an attachment', function () {
    ApplicationScreener::fake([atsAiEvaluation()]);

    $application = screenApplication(atsApplication(cvText: "%PDF-1.4\n\x89\x90\x91\x92", extension: 'pdf'));

    expect($application->ai_source)->toBe(AtsScoreSource::Ai);

    ApplicationScreener::assertPrompted(fn (AgentPrompt $prompt): bool => $prompt->attachments->count() === 1
        && $prompt->contains('attached as a PDF'));
});

test('scanned PDFs are unreadable when the AI attachment also fails', function () {
    ApplicationScreener::fake(fn () => throw new RuntimeException('Cannot read document'));

    $application = screenApplication(atsApplication(cvText: "%PDF-1.4\n\x89\x90\x91\x92", extension: 'pdf'));

    expect($application->ai_status)->toBe(AtsScreeningStatus::Unreadable)
        ->and($application->ai_error)->toContain('Cannot read document');
});

test('contact details are removed before the CV is sent while year ranges are kept', function () {
    ApplicationScreener::fake([atsAiEvaluation()]);

    screenApplication(atsApplication());

    ApplicationScreener::assertPrompted(fn (AgentPrompt $prompt): bool => ! $prompt->contains('john.carter@example.com')
        && ! $prompt->contains('123 4567')
        && ! $prompt->contains('johncarter.dev')
        && $prompt->contains('[email]')
        && $prompt->contains('[phone]')
        && $prompt->contains('2018 - 2024')
        && $prompt->contains(ApplicationScreener::CV_START));
});

test('the CV snapshot stored on the application is scored rather than the current profile CV', function () {
    ApplicationScreener::fake([atsAiEvaluation()]);

    $application = atsApplication(cvText: ATS_SAMPLE_CV."\nSnapshot marker: Kubernetes certified");
    $application->jobSeeker->forceFill(['resume_path' => 'resumes/other.docx'])->save();
    Storage::disk('local')->put('resumes/other.docx', atsDocx('Current default CV that must not be used'));

    screenApplication($application);

    ApplicationScreener::assertPrompted(fn (AgentPrompt $prompt): bool => $prompt->contains('Kubernetes certified')
        && ! $prompt->contains('must not be used'));
});

test('unchanged applications are skipped unless a re-score is forced', function () {
    ApplicationScreener::fake([atsAiEvaluation(), atsAiEvaluation(['skills_score' => 40])]);

    $application = atsApplication();

    screenApplication($application);
    screenApplication($application);

    ApplicationScreener::assertPromptedTimes(1);

    $rescored = screenApplication($application, force: true);

    ApplicationScreener::assertPromptedTimes(2);
    expect($rescored->ai_breakdown['skills_score'])->toBe(40)
        ->and($rescored->ai_attempts)->toBe(2);
});

test('changing the job requirements makes the score re-run', function () {
    ApplicationScreener::fake([atsAiEvaluation(), atsAiEvaluation()]);

    $application = atsApplication();
    screenApplication($application);

    $application->jobPost->update(['skills' => ['React', 'Go']]);
    screenApplication($application->fresh());

    ApplicationScreener::assertPromptedTimes(2);
});

test('nothing is scored when ATS is switched off globally', function () {
    PlatformSetting::query()->updateOrCreate(['key' => 'ats'], ['value' => ['enabled' => false, 'ai_enabled' => true]]);
    ApplicationScreener::fake();

    $application = screenApplication(atsApplication());

    expect($application->ai_status)->toBeNull()
        ->and($application->ai_score)->toBeNull();
    ApplicationScreener::assertNeverPrompted();
});

test('only rules are used when the admin turns AI providers off', function () {
    PlatformSetting::query()->updateOrCreate(['key' => 'ats'], ['value' => ['enabled' => true, 'ai_enabled' => false]]);
    ApplicationScreener::fake();

    $application = screenApplication(atsApplication());

    expect($application->ai_source)->toBe(AtsScoreSource::Rules)
        ->and($application->ai_attempts)->toBe(0)
        ->and($application->ai_error)->toBeNull();
    ApplicationScreener::assertNeverPrompted();
});

test('nothing is scored for an employer with screening disabled', function () {
    ApplicationScreener::fake();
    $employer = User::factory()->employer()->create(['ats_enabled' => false]);

    $application = screenApplication(atsApplication(employer: $employer));

    expect($application->ai_status)->toBeNull();
    ApplicationScreener::assertNeverPrompted();
});

test('screening does not touch the application timestamps', function () {
    ApplicationScreener::fake([atsAiEvaluation()]);
    $application = atsApplication();
    $application->forceFill(['updated_at' => now()->subDays(3)])->saveQuietly();
    $before = $application->fresh()->updated_at->toDateTimeString();

    $after = screenApplication($application);

    expect($after->updated_at->toDateTimeString())->toBe($before);
});

test('the batch size is always capped at 1000', function () {
    config(['ai.ats.batch_size' => 5000]);

    expect(app(AtsSettings::class)->batchSize())->toBe(1000);

    config(['ai.ats.batch_size' => 0]);

    expect(app(AtsSettings::class)->batchSize())->toBe(1);
});

test('phone redaction keeps year ranges and short numbers', function () {
    $builder = app(AtsInputBuilder::class);

    expect($builder->redact('Worked 2015 - 2019 and 2019-2024, call +966 50 123 4567 or 0501234567'))
        ->toBe('Worked 2015 - 2019 and 2019-2024, call [phone] or [phone]')
        ->and($builder->redact('Managed 120 staff across 3 sites'))->toBe('Managed 120 staff across 3 sites');
});
