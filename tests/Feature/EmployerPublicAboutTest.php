<?php

use App\Enums\OrganizationType;
use App\Models\User;

test('employers can update the public about company fields', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'Old Name',
        'industry' => null,
        'about' => null,
        'website' => null,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.profile.public-about.update'), [
            'company_name' => 'Gulf Tech Solutions',
            'organization_type' => OrganizationType::PrivateCompany->value,
            'industry' => 'Technology',
            'about' => '<p><strong>Cloud</strong> and product engineering studio based in Dubai.</p><script>alert(1)</script>',
            'website' => 'https://gulftech.example',
        ])
        ->assertRedirect();

    $employer->refresh();

    expect($employer->company_name)->toBe('Gulf Tech Solutions')
        ->and($employer->organization_type)->toBe(OrganizationType::PrivateCompany)
        ->and($employer->industry)->toBe('Technology')
        ->and($employer->about)->toContain('<strong>Cloud</strong>')
        ->and($employer->about)->not->toContain('<script>')
        ->and($employer->website)->toBe('https://gulftech.example');
});

test('employer job editor receives company about fields', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'Gulf Tech Solutions',
        'industry' => 'Technology',
        'about' => '<p>Cloud studio.</p>',
        'website' => 'https://gulftech.example',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.jobs.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerJobEditor')
            ->where('company.name', 'Gulf Tech Solutions')
            ->where('company.industry', 'Technology')
            ->where('company.about', '<p>Cloud studio.</p>')
            ->where('company.website', 'https://gulftech.example'));
});
