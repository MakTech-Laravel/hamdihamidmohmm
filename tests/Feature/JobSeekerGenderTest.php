<?php

use App\Enums\Gender;
use App\Models\JobSeekerProfile;
use App\Models\User;

test('job seekers can set their gender on their profile', function () {
    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'gender' => null,
    ]);

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), [
            'name' => $seeker->name,
            'phone' => '+249 900 000 000',
            'gender' => Gender::Female->value,
            'headline' => 'Finance Officer',
        ])
        ->assertRedirect();

    expect($seeker->fresh()->jobSeekerProfile?->gender)->toBe(Gender::Female);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/JobSeekerProfile')
            ->where('profile.gender', Gender::Female->value)
            ->where('profile.gender_label', 'Female')
            ->has('gender_options', 2));
});

test('gender must be male or female when provided', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), [
            'name' => $seeker->name,
            'phone' => '+249 900 000 000',
            'gender' => 'other',
        ])
        ->assertSessionHasErrors('gender');
});

test('job seekers can clear their gender', function () {
    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'gender' => Gender::Male,
    ]);

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), [
            'name' => $seeker->name,
            'phone' => '+249 900 000 000',
            'gender' => '',
        ])
        ->assertRedirect();

    expect($seeker->fresh()->jobSeekerProfile?->gender)->toBeNull();
});
