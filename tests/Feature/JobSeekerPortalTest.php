<?php

use App\Models\User;

test('job seekers can view their portal pages', function (string $routeName, string $component) {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    'dashboard' => ['job-seeker.dashboard', 'backend/User/JobSeekerDashboard'],
    'profile' => ['job-seeker.profile', 'backend/User/JobSeekerProfile'],
    'applications' => ['job-seeker.applications', 'backend/User/JobSeekerApplications'],
    'notifications' => ['job-seeker.notifications', 'backend/User/JobSeekerNotifications'],
    'settings' => ['job-seeker.settings', 'backend/User/JobSeekerSettings'],
]);

test('employers cannot access job seeker portal pages', function (string $routeName) {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route($routeName))
        ->assertRedirect(route('employer.dashboard'));
})->with([
    'dashboard' => ['job-seeker.dashboard'],
    'profile' => ['job-seeker.profile'],
    'applications' => ['job-seeker.applications'],
    'notifications' => ['job-seeker.notifications'],
    'settings' => ['job-seeker.settings'],
]);

test('guests are redirected from job seeker portal pages', function (string $routeName) {
    $this->get(route($routeName))->assertRedirect(route('login'));
})->with([
    'dashboard' => ['job-seeker.dashboard'],
    'profile' => ['job-seeker.profile'],
    'applications' => ['job-seeker.applications'],
    'notifications' => ['job-seeker.notifications'],
    'settings' => ['job-seeker.settings'],
]);
