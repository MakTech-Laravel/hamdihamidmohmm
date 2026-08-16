<?php

use App\Models\User;

test('employers can view the designed employer dashboard', function () {
    $employer = User::factory()->employer()->create([
        'name' => 'Fatima Al-Zahrani',
        'company_name' => 'TechCorp Solutions',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerDashboard')
            ->has('stats'));
});

test('employers can open designed employer portal module pages', function (string $route, string $component) {
    $employer = User::factory()->employer()->create([
        'company_name' => 'TechCorp Solutions',
    ]);

    $this->actingAs($employer)
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    ['employer.profile', 'backend/User/EmployerCompanyProfile'],
    ['employer.packages', 'backend/User/EmployerPackages'],
    ['employer.jobs', 'backend/User/EmployerJobs'],
    ['employer.applications', 'backend/User/EmployerApplications'],
    ['employer.notifications', 'backend/User/EmployerNotifications'],
    ['employer.settings', 'backend/User/EmployerSettings'],
]);

test('job seekers cannot view the employer dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('employer.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});
