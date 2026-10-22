<?php

use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Enums\JobPostStatus;
use App\Jobs\ScreenJobApplication;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use App\Services\Ats\ApplicationScreeningDispatcher;
use Database\Seeders\JobTaxonomySeeder;
use Illuminate\Bus\PendingBatch;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
    Storage::fake('local');
});

function atsCvUpload(): UploadedFile
{
    return UploadedFile::fake()->createWithContent('my-cv.docx', atsDocx(ATS_SAMPLE_CV));
}

test('applying with a CV queues the screening job on the ats queue', function () {
    Queue::fake();

    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), ['resume' => atsCvUpload()])
        ->assertRedirect(route('job-seeker.dashboard'));

    $application = JobApplication::query()->where('job_post_id', $job->id)->firstOrFail();

    expect($application->ai_status)->toBe(AtsScreeningStatus::Pending);
    Queue::assertPushedOn('ats', ScreenJobApplication::class, fn (ScreenJobApplication $queued): bool => $queued->applicationId === $application->id
        && $queued->force === false);
});

test('applying with a CV scores the application end to end with the sync queue', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create([
        'status' => JobPostStatus::Active,
        'skills' => ['React', 'Laravel'],
    ]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), ['resume' => atsCvUpload()])
        ->assertRedirect(route('job-seeker.dashboard'));

    $application = JobApplication::query()->where('job_post_id', $job->id)->firstOrFail();

    expect($application->ai_status)->toBe(AtsScreeningStatus::Completed)
        ->and($application->ai_source)->toBe(AtsScoreSource::Rules)
        ->and($application->ai_score)->toBeInt();
});

test('applying without a CV queues nothing and marks the application no_cv', function () {
    Queue::fake();

    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job))
        ->assertRedirect(route('job-seeker.dashboard'));

    expect(JobApplication::query()->where('job_post_id', $job->id)->firstOrFail()->ai_status)
        ->toBe(AtsScreeningStatus::NoCv);
    Queue::assertNotPushed(ScreenJobApplication::class);
});

test('applying to an employer with screening disabled queues nothing', function () {
    Queue::fake();

    $seeker = User::factory()->jobSeeker()->create();
    $employer = User::factory()->employer()->create(['ats_enabled' => false]);
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active, 'employer_id' => $employer->id]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), ['resume' => atsCvUpload()])
        ->assertRedirect(route('job-seeker.dashboard'));

    expect(JobApplication::query()->where('job_post_id', $job->id)->firstOrFail()->ai_status)->toBeNull();
    Queue::assertNotPushed(ScreenJobApplication::class);
});

test('a screening failure never breaks the apply request', function () {
    $this->mock(ApplicationScreeningDispatcher::class)
        ->shouldReceive('dispatchOne')
        ->andThrow(new RuntimeException('Queue connection lost'));

    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), ['resume' => atsCvUpload()])
        ->assertRedirect(route('job-seeker.dashboard'))
        ->assertSessionHas('success', 'application_submitted');

    expect(JobApplication::query()->where('job_post_id', $job->id)->exists())->toBeTrue();
});

test('bulk screening splits applications into batches of the configured size', function () {
    Bus::fake();
    config(['ai.ats.batch_size' => 2]);

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    JobApplication::factory()->count(5)->create(['job_post_id' => $job->id]);

    $queued = app(ApplicationScreeningDispatcher::class)->dispatchForJob($job, 'unscored');

    expect($queued)->toBe(5)
        ->and(JobApplication::query()->where('ai_status', AtsScreeningStatus::Pending->value)->count())->toBe(5);

    Bus::assertBatchCount(3);
    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 2
        && $batch->name === "ats:job:{$job->id}:part1"
        && $batch->queue() === 'ats'
        && $batch->allowsFailures());
    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 1
        && $batch->name === "ats:job:{$job->id}:part3");
});

test('bulk modes only pick the matching applications', function () {
    Bus::fake();

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    JobApplication::factory()->create(['job_post_id' => $job->id]);
    JobApplication::factory()->create(['job_post_id' => $job->id])
        ->forceFill(['ai_status' => AtsScreeningStatus::Failed])->saveQuietly();
    JobApplication::factory()->create(['job_post_id' => $job->id])
        ->forceFill(['ai_status' => AtsScreeningStatus::Completed, 'ai_source' => AtsScoreSource::Ai, 'ai_score' => 80])->saveQuietly();

    $dispatcher = app(ApplicationScreeningDispatcher::class);

    expect($dispatcher->dispatchForJob($job, 'failed'))->toBe(1);
    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->every(fn (ScreenJobApplication $queued): bool => $queued->force === false));

    expect($dispatcher->dispatchForJob($job, 'all'))->toBe(3);
    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 3
        && $batch->jobs->every(fn (ScreenJobApplication $queued): bool => $queued->force === true));
});

test('a second bulk run is blocked while the first holds the lock', function () {
    Bus::fake();

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    JobApplication::factory()->count(2)->create(['job_post_id' => $job->id]);

    $lock = Cache::lock('ats:bulk:'.$job->id, 600);
    $lock->get();

    expect(app(ApplicationScreeningDispatcher::class)->dispatchForJob($job, 'unscored'))->toBeNull();
    Bus::assertNothingBatched();

    $lock->release();

    expect(app(ApplicationScreeningDispatcher::class)->dispatchForJob($job, 'unscored'))->toBe(2);
});

test('the ats:score command backfills unscored applications', function () {
    Bus::fake();

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    JobApplication::factory()->count(2)->create(['job_post_id' => $job->id]);

    $disabledEmployer = User::factory()->employer()->create(['ats_enabled' => false]);
    JobApplication::factory()->create([
        'job_post_id' => JobPost::factory()->create(['employer_id' => $disabledEmployer->id])->id,
    ]);

    $this->artisan('ats:score', ['--only' => 'unscored'])
        ->expectsOutputToContain('Queued 2 application(s)')
        ->assertSuccessful();

    Bus::assertBatchCount(1);
});

test('the ats:score command rejects an unknown mode', function () {
    $this->artisan('ats:score', ['--only' => 'everything'])->assertFailed();
});

test('ats:retry-ai only re-queues recent rule-scored applications that have attempts left', function () {
    Bus::fake();
    config(['ai.ats.ai_enabled' => true]);

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    $rulesScored = ['ai_status' => AtsScreeningStatus::Completed, 'ai_source' => AtsScoreSource::Rules, 'ai_score' => 60];

    $retry = JobApplication::factory()->create(['job_post_id' => $job->id]);
    $retry->forceFill([...$rulesScored, 'ai_attempts' => 1])->saveQuietly();

    JobApplication::factory()->create(['job_post_id' => $job->id, 'created_at' => now()->subDays(5)])
        ->forceFill($rulesScored)->saveQuietly();
    JobApplication::factory()->create(['job_post_id' => $job->id])
        ->forceFill([...$rulesScored, 'ai_attempts' => 3])->saveQuietly();
    JobApplication::factory()->create(['job_post_id' => $job->id])
        ->forceFill(['ai_status' => AtsScreeningStatus::Completed, 'ai_source' => AtsScoreSource::Ai, 'ai_score' => 90])->saveQuietly();

    $this->artisan('ats:retry-ai')
        ->expectsOutputToContain('Queued 1 application(s)')
        ->assertSuccessful();

    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 1
        && $batch->jobs->first()->applicationId === $retry->id);
});

test('ats:retry-ai does nothing while AI providers are off', function () {
    Bus::fake();

    $this->artisan('ats:retry-ai')
        ->expectsOutputToContain('Queued 0 application(s)')
        ->assertSuccessful();

    Bus::assertNothingBatched();
});

test('ats:recover-stale re-queues old pending applications and leaves fresh ones alone', function () {
    Bus::fake();
    config(['ai.ats.stale_after_minutes' => 30]);

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);

    $stale = JobApplication::factory()->create(['job_post_id' => $job->id]);
    $stale->forceFill(['ai_status' => AtsScreeningStatus::Pending])->saveQuietly();
    JobApplication::query()->whereKey($stale->id)->toBase()->update([
        'updated_at' => now()->subMinutes(45),
    ]);

    $fresh = JobApplication::factory()->create(['job_post_id' => $job->id]);
    $fresh->forceFill(['ai_status' => AtsScreeningStatus::Pending])->saveQuietly();
    JobApplication::query()->whereKey($fresh->id)->toBase()->update([
        'updated_at' => now()->subMinutes(5),
    ]);

    $this->artisan('ats:recover-stale')
        ->expectsOutputToContain('Queued 1 stale application(s)')
        ->assertSuccessful();

    Bus::assertBatched(fn (PendingBatch $batch): bool => $batch->jobs->count() === 1
        && $batch->jobs->first()->applicationId === $stale->id
        && $batch->name === 'ats:stale:part1');
});

test('ats:recover-stale does nothing when ATS is disabled', function () {
    Bus::fake();
    config(['ai.ats.enabled' => false]);

    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create(['employer_id' => $employer->id]);
    $stale = JobApplication::factory()->create(['job_post_id' => $job->id]);
    $stale->forceFill(['ai_status' => AtsScreeningStatus::Processing])->saveQuietly();
    JobApplication::query()->whereKey($stale->id)->toBase()->update([
        'updated_at' => now()->subHours(2),
    ]);

    $this->artisan('ats:recover-stale')
        ->expectsOutputToContain('Queued 0 stale application(s)')
        ->assertSuccessful();

    Bus::assertNothingBatched();
});

test('a job that gives up marks the application as failed', function () {
    $application = atsApplication();
    $application->forceFill(['ai_status' => AtsScreeningStatus::Pending])->saveQuietly();

    (new ScreenJobApplication($application->id))->failed(new RuntimeException('Worker timed out'));

    expect($application->fresh())
        ->ai_status->toBe(AtsScreeningStatus::Failed)
        ->ai_error->toBe('Worker timed out');
});

test('the screening job is unique per application and runs on the ats queue', function () {
    $job = new ScreenJobApplication(42);

    expect($job->uniqueId())->toBe('42')
        ->and($job->queue)->toBe('ats')
        ->and($job->timeout)->toBe(120)
        ->and($job->maxExceptions)->toBe(3)
        ->and($job->retryUntil()->greaterThan(now()->addHours(11)))->toBeTrue();
});
