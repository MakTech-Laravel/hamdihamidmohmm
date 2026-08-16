<?php

use App\Models\User;

test('employers can view the designed employer dashboard', function () {
    $employer = User::factory()->employer()->create([
        'name' => 'Horizon Hiring Ltd',
        'company_name' => 'TechCorp Solutions',
        'contact_name' => 'Fatima Al-Zahrani',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerDashboard')
            ->where('first_name', 'Fatima')
            ->where('plan.is_verified', true)
            ->has('stats')
            ->has('plan')
            ->has('active_jobs')
            ->has('recent_applications')
            ->has('notifications'));
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
    ['employer.jobs.create', 'backend/User/EmployerJobEditor'],
    ['employer.applications', 'backend/User/EmployerApplications'],
    ['employer.notifications', 'backend/User/EmployerNotifications'],
    ['employer.settings', 'backend/User/EmployerSettings'],
]);

test('employer company profile reports live completion and verification', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'TechCorp Solutions',
        'contact_name' => 'Fatima Al-Zahrani',
        'linkedin_url' => null,
        'x_url' => null,
        'instagram_url' => null,
        'verified_at' => now()->setDate(2026, 8, 1),
    ]);

    $this->actingAs($employer)
        ->get(route('employer.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerCompanyProfile')
            ->where('completion.sections.social', false)
            ->where('completion.sections.cover', false)
            ->where('profile.verification_value', 'approved')
            ->where('profile.verified_on', 'Aug 1, 2026')
            ->has('completion.percent'));
});

test('job seekers cannot view the employer dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('employer.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});
