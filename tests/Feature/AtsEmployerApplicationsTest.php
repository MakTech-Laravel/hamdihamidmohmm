<?php

use App\Enums\AtsRecommendation;
use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Enums\JobApplicationStatus;
use App\Jobs\ScreenJobApplication;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use App\Services\Ats\ApplicationScreeningService;
use Illuminate\Bus\PendingBatch;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

/**
 * @param  array<string, mixed>  $attributes
 */
function scoredApplication(JobPost $job, ?int $score, array $attributes = []): JobApplication
{
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'status' => $attributes['status'] ?? JobApplicationStatus::Applied,
    ]);

    $application->forceFill([
        'ai_status' => $score === null ? null : AtsScreeningStatus::Completed,
        'ai_source' => $score === null ? null : AtsScoreSource::Ai,
        'ai_score' => $score,
        'ai_recommendation' => $score === null ? null : AtsRecommendation::fromScore($score, 75, 50),
        'ai_summary' => $score === null ? null : "Scored {$score}",
        ...collect($attributes)->except('status')->all(),
    ])->saveQuietly();

    return $application;
}

test('employers see AI score fields and the ats prop on the applications page', function () {
    $application = atsApplication();
    app(ApplicationScreeningService::class)->screen($application);

    $this->actingAs($application->jobPost->employer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerApplications')
            ->where('applications.0.ai_status', 'completed')
            ->where('applications.0.ai_source', 'rules')
            ->where('applications.0.ai_score', 88)
            ->where('applications.0.ai_recommendation', 'strong_match')
            ->where('applications.0.ai_outdated', false)
            ->where('applications.0.ai_cv_name', 'john-carter-cv.docx')
            ->where('applications.0.ai_breakdown.matched_skills', ['React', 'TypeScript', 'Laravel'])
            ->missing('applications.0.ai_breakdown.job_hash')
            ->where('applications.0.ai_rescore_url', route('employer.applications.rescore', $application))
            ->where('ats.enabled', true)
            ->where('ats.has_pending', false)
            ->where('ats.suggested_shortlist', [])
            ->where('filters.ai_sort', '')
            ->where('filters.ai_band', ''));
});

test('scores are marked outdated after the job requirements change', function () {
    $application = atsApplication();
    app(ApplicationScreeningService::class)->screen($application);

    $application->jobPost->update(['skills' => ['Go', 'Rust']]);

    $this->actingAs($application->jobPost->employer)
        ->get(route('employer.applications'))
        ->assertInertia(fn ($page) => $page->where('applications.0.ai_outdated', true));
});

test('employers can sort by AI score with unscored applications last', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    $low = scoredApplication($job, 40);
    $unscored = scoredApplication($job, null);
    $high = scoredApplication($job, 90);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['ai_sort' => 'desc']))
        ->assertInertia(fn ($page) => $page
            ->where('filters.ai_sort', 'desc')
            ->where('applications.0.id', $high->id)
            ->where('applications.1.id', $low->id)
            ->where('applications.2.id', $unscored->id));

    $this->actingAs($employer)
        ->get(route('employer.applications', ['ai_sort' => 'asc']))
        ->assertInertia(fn ($page) => $page
            ->where('applications.0.id', $low->id)
            ->where('applications.1.id', $high->id)
            ->where('applications.2.id', $unscored->id));
});

test('employers can filter applications by AI score band', function (string $band, array $expectedScores) {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    scoredApplication($job, 90);
    scoredApplication($job, 60);
    scoredApplication($job, 20);
    scoredApplication($job, null);
    scoredApplication($job, null, ['ai_status' => AtsScreeningStatus::NoCv]);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['ai_band' => $band, 'ai_sort' => 'desc']))
        ->assertInertia(fn ($page) => $page
            ->where('filters.ai_band', $band)
            ->where('applications', fn ($applications): bool => collect($applications)->pluck('ai_score')->all() === $expectedScores));
})->with([
    'strong' => ['strong', [90]],
    'possible' => ['possible', [60]],
    'weak' => ['weak', [20]],
    'pending' => ['pending', [null]],
    'no_cv' => ['no_cv', [null]],
]);

test('employers can filter failed and unreadable applications and see ai_error', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    $failed = scoredApplication($job, null, [
        'ai_status' => AtsScreeningStatus::Failed,
        'ai_error' => 'Provider timed out',
    ]);
    scoredApplication($job, null, [
        'ai_status' => AtsScreeningStatus::Unreadable,
        'ai_error' => 'Could not extract CV text',
    ]);
    scoredApplication($job, 90);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['ai_band' => 'failed']))
        ->assertInertia(fn ($page) => $page
            ->has('applications', 1)
            ->where('applications.0.id', $failed->id)
            ->where('applications.0.ai_error', 'Provider timed out'));

    $this->actingAs($employer)
        ->get(route('employer.applications', ['ai_band' => 'unreadable']))
        ->assertInertia(fn ($page) => $page
            ->has('applications', 1)
            ->where('applications.0.ai_status', 'unreadable')
            ->where('applications.0.ai_error', 'Could not extract CV text'));
});

test('employers can bulk upgrade rule-scored applications', function () {
    Bus::fake();
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    scoredApplication($job, 60, ['ai_source' => AtsScoreSource::Rules]);
    scoredApplication($job, 80, ['ai_source' => AtsScoreSource::Ai]);

    $this->actingAs($employer)
        ->post(route('employer.jobs.applications.rescore', $job), ['mode' => 'rules'])
        ->assertSessionHas('success', 'Queued 1 application(s) for AI scoring.');

    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 1);
});

test('the suggested shortlist only includes strong matches still awaiting review for the selected job', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    $top = scoredApplication($job, 95);
    $second = scoredApplication($job, 80, ['status' => JobApplicationStatus::UnderReview]);
    scoredApplication($job, 85, ['status' => JobApplicationStatus::Interview]);
    scoredApplication($job, 60);

    $this->actingAs($employer)
        ->get(route('employer.applications'))
        ->assertInertia(fn ($page) => $page->where('ats.suggested_shortlist', []));

    $this->actingAs($employer)
        ->get(route('employer.applications', ['job_id' => $job->id]))
        ->assertInertia(fn ($page) => $page
            ->has('ats.suggested_shortlist', 2)
            ->where('ats.suggested_shortlist.0.id', $top->id)
            ->where('ats.suggested_shortlist.1.id', $second->id)
            ->where('ats.rescore_url', route('employer.jobs.applications.rescore', $job)));
});

test('the page reports pending screening so it can poll', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    scoredApplication($job, null, ['ai_status' => AtsScreeningStatus::Pending]);

    $this->actingAs($employer)
        ->get(route('employer.applications'))
        ->assertInertia(fn ($page) => $page
            ->where('ats.has_pending', true)
            ->where('applications.0.ai_status', 'pending'));
});

test('AI fields are hidden from employers with screening disabled', function () {
    $employer = User::factory()->employer()->create(['ats_enabled' => false]);
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    scoredApplication($job, 90);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['ai_sort' => 'desc', 'ai_band' => 'strong']))
        ->assertInertia(fn ($page) => $page
            ->where('ats.enabled', false)
            ->where('filters.ai_sort', '')
            ->where('filters.ai_band', '')
            ->where('applications.0.ai_score', null)
            ->where('applications.0.ai_summary', null)
            ->where('applications.0.ai_rescore_url', null));
});

test('employers can re-score one of their applications', function () {
    Queue::fake();
    $application = atsApplication();

    $this->actingAs($application->jobPost->employer)
        ->from(route('employer.applications'))
        ->post(route('employer.applications.rescore', $application))
        ->assertRedirect(route('employer.applications'))
        ->assertSessionHas('success');

    Queue::assertPushed(ScreenJobApplication::class, fn (ScreenJobApplication $job): bool => $job->applicationId === $application->id
        && $job->force === true);
});

test('re-scoring an application without a CV reports an error', function () {
    Queue::fake();
    $application = atsApplication(cvText: null);

    $this->actingAs($application->jobPost->employer)
        ->post(route('employer.applications.rescore', $application))
        ->assertSessionHas('error');

    Queue::assertNothingPushed();
    expect($application->fresh()->ai_status)->toBe(AtsScreeningStatus::NoCv);
});

test('employers cannot re-score applications for other employers', function () {
    Queue::fake();
    $application = atsApplication();
    $otherEmployer = User::factory()->employer()->create();

    $this->actingAs($otherEmployer)
        ->post(route('employer.applications.rescore', $application))
        ->assertForbidden();

    $this->actingAs($otherEmployer)
        ->post(route('employer.jobs.applications.rescore', $application->jobPost), ['mode' => 'all'])
        ->assertForbidden();

    Queue::assertNothingPushed();
});

test('employers with screening disabled cannot re-score', function () {
    $employer = User::factory()->employer()->create(['ats_enabled' => false]);
    $application = atsApplication(employer: $employer);

    $this->actingAs($employer)
        ->post(route('employer.applications.rescore', $application))
        ->assertForbidden();
});

test('employers can bulk re-score a job in batches', function () {
    Bus::fake();
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    JobApplication::factory()->count(3)->create(['job_post_id' => $job->id]);

    $this->actingAs($employer)
        ->post(route('employer.jobs.applications.rescore', $job), ['mode' => 'all'])
        ->assertSessionHas('success', 'Queued 3 application(s) for AI scoring.');

    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 3);
});

test('bulk re-score validates the mode', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);

    $this->actingAs($employer)
        ->post(route('employer.jobs.applications.rescore', $job), ['mode' => 'everything'])
        ->assertSessionHasErrors(['mode' => 'Please choose a valid re-score option.']);
});

test('re-score requests are throttled', function () {
    Bus::fake();
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);

    foreach (range(1, 10) as $attempt) {
        $this->actingAs($employer)
            ->post(route('employer.jobs.applications.rescore', $job), ['mode' => 'unscored'])
            ->assertRedirect();
    }

    $this->actingAs($employer)
        ->post(route('employer.jobs.applications.rescore', $job), ['mode' => 'unscored'])
        ->assertTooManyRequests();
});
