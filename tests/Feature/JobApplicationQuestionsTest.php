<?php

use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
    Storage::fake('local');
});

/**
 * @return array<string, mixed>
 */
function jobPayload(array $overrides = []): array
{
    return [
        'title' => 'Frontend Engineer',
        'category' => 'others',
        'location' => 'khartoum',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'description' => 'Build product interfaces with the team.',
        'requirements' => 'Strong React experience required.',
        'skills' => ['React', 'TypeScript'],
        'publish' => false,
        ...$overrides,
    ];
}

test('employers can save application questions on a job', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), jobPayload([
            'application_questions' => [
                [
                    'id' => 'q-years',
                    'prompt' => 'Years with React?',
                    'type' => 'text',
                    'required' => true,
                    'sort' => 0,
                ],
                [
                    'id' => 'q-remote',
                    'prompt' => 'Open to remote?',
                    'type' => 'yes_no',
                    'required' => false,
                    'sort' => 1,
                ],
            ],
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->where('employer_id', $employer->id)->first();

    expect($job)->not->toBeNull()
        ->and($job->application_questions)->toHaveCount(2)
        ->and($job->application_questions[0]['prompt'])->toBe('Years with React?')
        ->and($job->application_questions[0]['required'])->toBeTrue();
});

test('required application questions must be answered when applying', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
        'application_questions' => [
            [
                'id' => 'q-years',
                'prompt' => 'Years with React?',
                'type' => 'text',
                'required' => true,
                'sort' => 0,
            ],
        ],
    ]);
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'resume' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
            'question_answers' => [],
        ])
        ->assertSessionHasErrors('question_answers.q-years');

    expect(JobApplication::query()->where('job_post_id', $job->id)->exists())->toBeFalse();
});

test('application answers are stored and visible to the employer', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
        'application_questions' => [
            [
                'id' => 'q-years',
                'prompt' => 'Years with React?',
                'type' => 'text',
                'required' => true,
                'sort' => 0,
            ],
        ],
    ]);
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Answer Seeker']);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'resume' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
            'question_answers' => ['q-years' => '5 years'],
        ])
        ->assertRedirect();

    $application = JobApplication::query()->where('job_post_id', $job->id)->first();

    expect($application?->question_answers)->toMatchArray(['q-years' => '5 years']);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['job_id' => $job->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('applications.data.0.name', 'Answer Seeker')
            ->where('applications.data.0.question_answers.0.prompt', 'Years with React?')
            ->where('applications.data.0.question_answers.0.answer', '5 years'));
});

test('jobs without questions still accept applications', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
        'application_questions' => null,
    ]);
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'resume' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
            'cover_letter' => 'I am interested.',
        ])
        ->assertRedirect();

    expect(JobApplication::query()->where('job_post_id', $job->id)->exists())->toBeTrue();
});
