<?php

use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Enums\TrainingRegistrationStatus;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use App\Models\User;
use App\Notifications\TrainingRegistrationConfirmedNotification;
use App\Notifications\TrainingRegistrationReceivedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

function registrationPayload(TrainingCourse $course, array $overrides = []): array
{
    return array_merge([
        'full_name' => 'Layla Hassan',
        'email' => 'layla@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'phone' => '+974 5555 0101',
        'country_city' => 'Doha, Qatar',
        'organization' => 'Gulf Training',
        'job_title' => 'Coordinator',
        'experience' => 'Five years in program coordination.',
        'reason' => 'I want to apply the methods in my team.',
        'answers' => collect($course->normalizedQuestions())->map(fn (array $question): array => [
            'id' => $question['id'],
            'value' => $question['type'] === 'yes_no'
                ? 'yes'
                : ($question['type'] === 'single_choice' ? ($question['options'][0] ?? '') : 'Answer'),
        ])->all(),
        'consent' => '1',
    ], $overrides);
}

test('visitors can browse published courses and open course details', function () {
    $open = TrainingCourse::factory()->create([
        'title' => 'Safety workshop',
        'seats' => 10,
    ]);
    TrainingRegistration::factory()->create([
        'training_course_id' => $open->id,
        'status' => TrainingRegistrationStatus::Pending,
    ]);
    TrainingCourse::factory()->unpublished()->create([
        'title' => 'Hidden course',
    ]);

    $this->get(route('training.courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/training-courses')
            ->has('courses', 1)
            ->where('courses.0.title', 'Safety workshop')
            ->where('courses.0.available_seats', 9)
            ->where('courses.0.trainer', $open->trainer)
            ->where('courses.0.location', $open->location)
            ->where('courses.0.duration', $open->duration)
            ->where('courses.0.description', $open->description)
            ->where('courses.0.thumbnail_url', null));

    $this->get(route('training.courses.show', $open))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/training-course-show')
            ->where('course.title', 'Safety workshop')
            ->where('course.description', $open->description)
            ->where('course.available_seats', 9)
            ->where('course.registration_open', true));

    $this->get(route('training'))
        ->assertOk();
});

test('unpublished courses are not public', function () {
    $course = TrainingCourse::factory()->unpublished()->create();

    $this->get(route('training.courses.show', $course))->assertNotFound();
    $this->get(route('training.courses.register', $course))->assertNotFound();
});

test('a visitor can register and receives a confirmation number', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $course = TrainingCourse::factory()->withQuestions([
        [
            'id' => 'visa',
            'label' => 'Do you need a visa letter?',
            'type' => 'yes_no',
            'required' => true,
            'options' => [],
        ],
    ])->create();

    $this->post(route('training.courses.register.store', $course), registrationPayload($course))
        ->assertRedirect();

    $registration = TrainingRegistration::query()->first();

    $seeker = User::query()->where('email', 'layla@example.com')->first();

    expect($registration)->not->toBeNull()
        ->and($registration->status)->toBe(TrainingRegistrationStatus::Pending)
        ->and($registration->registration_number)->toStartWith('TR-')
        ->and($registration->consent_accepted_at)->not->toBeNull()
        ->and($registration->answers[0]['label'])->toBe('Do you need a visa letter?')
        ->and($registration->answers[0]['value'])->toBe('yes')
        ->and($seeker)->not->toBeNull()
        ->and($seeker->isJobSeeker())->toBeTrue()
        ->and($seeker->name)->toBe('Layla Hassan')
        ->and($seeker->phone)->toBe('+974 5555 0101')
        ->and($seeker->location)->toBe('Doha, Qatar')
        ->and($seeker->account_status)->toBe(JobSeekerAccountStatus::Active)
        ->and($seeker->resume_status)->toBe(JobSeekerResumeStatus::Warning)
        ->and(Hash::check('password', $seeker->password))->toBeTrue();

    $this->get(route('training.registrations.confirmation', [
        'trainingRegistration' => $registration->public_token,
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/training-registration-confirmation')
            ->where('registration.number', $registration->registration_number));

    Notification::assertSentOnDemand(TrainingRegistrationConfirmedNotification::class, function (TrainingRegistrationConfirmedNotification $notification): bool {
        return str_starts_with($notification->registrationNumber, 'TR-');
    });

    Notification::assertSentTo($admin, TrainingRegistrationReceivedNotification::class, function (TrainingRegistrationReceivedNotification $notification) use ($registration): bool {
        return $notification->registrationNumber === $registration->registration_number
            && str_contains($notification->adminUrl, '/admin/training/registrations/'.$registration->id);
    });

    expect(new TrainingRegistrationConfirmedNotification('TR-2026-00001', 'Course', 'Layla'))
        ->toBeInstanceOf(ShouldQueue::class)
        ->and(new TrainingRegistrationReceivedNotification('TR-2026-00001', 'Course', 'Layla', 'https://example.test'))
        ->toBeInstanceOf(ShouldQueue::class);
});

test('registration requires consent and closes when the deadline passed or seats are full', function () {
    $course = TrainingCourse::factory()->create();

    $this->post(route('training.courses.register.store', $course), registrationPayload($course, [
        'consent' => '0',
    ]))->assertSessionHasErrors('consent');

    $expired = TrainingCourse::factory()->create([
        'registration_deadline' => now()->subDay()->toDateString(),
    ]);

    $this->post(route('training.courses.register.store', $expired), registrationPayload($expired))
        ->assertSessionHasErrors('course');

    $full = TrainingCourse::factory()->create(['seats' => 1]);
    TrainingRegistration::factory()->create([
        'training_course_id' => $full->id,
        'status' => TrainingRegistrationStatus::Approved,
    ]);

    $this->post(route('training.courses.register.store', $full), registrationPayload($full))
        ->assertSessionHasErrors('course');

    expect(TrainingRegistration::query()->where('training_course_id', $full->id)->count())->toBe(1);
});

test('registration creates no account when the password does not match or the email is taken', function () {
    $course = TrainingCourse::factory()->create();

    $this->post(route('training.courses.register.store', $course), registrationPayload($course, [
        'password_confirmation' => 'different-password',
    ]))->assertSessionHasErrors('password');

    User::factory()->jobSeeker()->create(['email' => 'layla@example.com']);

    $this->post(route('training.courses.register.store', $course), registrationPayload($course))
        ->assertSessionHasErrors('email');

    expect(TrainingRegistration::query()->count())->toBe(0)
        ->and(User::query()->where('email', 'layla@example.com')->count())->toBe(1);
});

test('admins can manage courses, filter registrations, export them, and protect seat capacity', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $course = TrainingCourse::factory()->create(['seats' => 1, 'title' => 'Export course']);
    $other = TrainingCourse::factory()->create(['title' => 'Other course']);

    $this->actingAs($admin)
        ->post(route('admin.training.courses.store'), [
            'title' => 'New facilitation course',
            'description' => 'A practical course.',
            'starts_on' => now()->addWeek()->toDateString(),
            'ends_on' => now()->addWeeks(2)->toDateString(),
            'duration' => '2 days',
            'location' => 'Doha',
            'trainer' => 'Nora Ali',
            'seats' => 12,
            'registration_deadline' => now()->addDays(3)->toDateString(),
            'is_published' => '1',
            'questions' => [
                [
                    'id' => 'level',
                    'label' => 'Experience level',
                    'type' => 'single_choice',
                    'required' => '1',
                    'options' => ['Beginner', 'Advanced'],
                ],
            ],
            'thumbnail' => UploadedFile::fake()->image('course.jpg'),
        ])
        ->assertRedirect(route('admin.training.courses.index'));

    $created = TrainingCourse::query()->where('title', 'New facilitation course')->first();

    expect($created)->not->toBeNull()
        ->and($created->questions[0]['label'])->toBe('Experience level')
        ->and($created->is_published)->toBeTrue()
        ->and($created->thumbnail_path)->not->toBeNull()
        ->and($created->description)->toBe('A practical course.');

    Storage::disk('public')->assertExists($created->thumbnail_path);

    $this->get(route('training.courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('courses', fn ($courses) => collect($courses)->contains(
                fn (array $course): bool => $course['title'] === 'New facilitation course'
                    && $course['description'] === 'A practical course.'
                    && is_string($course['thumbnail_url'])
                    && str_contains($course['thumbnail_url'], '/storage/'),
            )));

    $pending = TrainingRegistration::factory()->create([
        'training_course_id' => $course->id,
        'full_name' => 'Pending Person',
        'status' => TrainingRegistrationStatus::Pending,
        'answers' => [
            ['id' => 'visa', 'label' => 'Visa letter', 'type' => 'yes_no', 'value' => 'yes'],
        ],
    ]);
    $waitlisted = TrainingRegistration::factory()->create([
        'training_course_id' => $course->id,
        'full_name' => 'Wait Person',
        'email' => 'wait@example.com',
        'status' => TrainingRegistrationStatus::Waitlisted,
    ]);
    TrainingRegistration::factory()->create([
        'training_course_id' => $other->id,
        'full_name' => 'Other Person',
        'status' => TrainingRegistrationStatus::Approved,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.training.registrations.index', [
            'course' => $course->id,
            'status' => TrainingRegistrationStatus::Pending->value,
            'search' => 'Pending',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/TrainingRegistrations')
            ->has('registrations', 1)
            ->where('registrations.0.number', $pending->registration_number));

    $export = $this->actingAs($admin)
        ->get(route('admin.training.registrations.export', ['course' => $course->id]));

    $export->assertOk();
    expect($export->streamedContent())
        ->toContain('Visa letter')
        ->toContain($pending->registration_number)
        ->not->toContain('Other Person');

    $this->actingAs($admin)
        ->patch(route('admin.training.registrations.update', $waitlisted), [
            'status' => TrainingRegistrationStatus::Approved->value,
        ])
        ->assertSessionHasErrors('status');

    expect($waitlisted->fresh()->status)->toBe(TrainingRegistrationStatus::Waitlisted);

    $this->actingAs($admin)
        ->patch(route('admin.training.registrations.update', $pending), [
            'status' => TrainingRegistrationStatus::Completed->value,
        ])
        ->assertRedirect();

    expect($pending->fresh()->status)->toBe(TrainingRegistrationStatus::Completed);
});
