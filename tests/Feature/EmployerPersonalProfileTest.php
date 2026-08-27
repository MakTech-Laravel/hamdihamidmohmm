<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('employers can update personal name from settings and manage profile photo', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create([
        'name' => 'Old Employer Name',
        'contact_name' => 'Old Employer Name',
        'avatar' => null,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->put(route('employer.settings.update'), [
            'name' => 'Sara Ahmed',
            'email' => $employer->email,
            'phone' => $employer->phone,
        ])
        ->assertRedirect(route('employer.settings'));

    $employer->refresh();

    expect($employer->name)->toBe('Sara Ahmed')
        ->and($employer->contact_name)->toBe('Sara Ahmed');

    $photo = UploadedFile::fake()->image('avatar.png', 400, 400);

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->post(route('employer.profile.photo.upload'), ['photo' => $photo])
        ->assertRedirect(route('employer.settings'));

    $employer->refresh();

    expect($employer->avatar)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $employer->avatar))->toBeTrue();

    $this->actingAs($employer)
        ->get(route('employer.settings'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerSettings')
            ->where('profile.name', 'Sara Ahmed')
            ->where('profile.photo_url', $employer->avatar_url));

    $this->actingAs($employer)
        ->get(route('employer.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerCompanyProfile')
            ->missing('completion.sections.personal')
            ->missing('profile.photo_url'));

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->delete(route('employer.profile.photo.destroy'))
        ->assertRedirect(route('employer.settings'));

    $employer->refresh();

    expect($employer->avatar)->toBeNull();
});

test('job seekers cannot upload employer profile photos', function () {
    Storage::fake('public');

    $seeker = User::factory()->jobSeeker()->create();
    $photo = UploadedFile::fake()->image('avatar.png', 200, 200);

    $this->actingAs($seeker)
        ->post(route('employer.profile.photo.upload'), ['photo' => $photo])
        ->assertRedirect(route('job-seeker.dashboard'));
});
