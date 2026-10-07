<?php

use App\Enums\OrganizationType;
use App\Models\User;

test('organization profile page includes organization type options', function () {
    $employer = User::factory()->employer()->create([
        'organization_type' => OrganizationType::Ngo,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerCompanyProfile')
            ->where('profile.organization_type', OrganizationType::Ngo->value)
            ->where('profile.organization_type_label', 'NGO')
            ->has('organizationTypes', count(OrganizationType::cases()))
            ->where('organizationTypes.0.value', OrganizationType::PrivateCompany->value));
});

test('employers can save non-profit organization profile details', function () {
    $employer = User::factory()->employer()->create([
        'organization_type' => OrganizationType::PrivateCompany,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.profile.update'), [
            'company_name' => 'Gulf Relief Foundation',
            'organization_type' => OrganizationType::NonProfit->value,
            'contact_name' => 'Sara Ahmed',
            'industry' => 'Humanitarian Aid',
            'company_size' => '51-200',
            'founded_year' => 2005,
            'website' => 'https://gulfrelief.example',
            'linkedin_url' => 'https://linkedin.com/company/gulfrelief',
            'about' => 'Supporting communities across the region.',
            'address' => 'Dubai',
            'phone' => '+971 4 000 0000',
            'email' => $employer->email,
        ])
        ->assertRedirect();

    $employer->refresh();

    expect($employer->company_name)->toBe('Gulf Relief Foundation')
        ->and($employer->organization_type)->toBe(OrganizationType::NonProfit)
        ->and($employer->industry)->toBe('Humanitarian Aid');
});

test('public about update accepts public sector organization type', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->put(route('employer.profile.public-about.update'), [
            'company_name' => 'National Skills Institute',
            'organization_type' => OrganizationType::PublicSector->value,
            'industry' => 'Education',
            'about' => '<p>Public training institute.</p>',
            'website' => 'https://skills.gov.example',
        ])
        ->assertRedirect();

    $employer->refresh();

    expect($employer->company_name)->toBe('National Skills Institute')
        ->and($employer->organization_type)->toBe(OrganizationType::PublicSector);
});

test('organization profile update rejects invalid organization type', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->put(route('employer.profile.update'), [
            'company_name' => 'Invalid Org',
            'organization_type' => 'not-a-real-type',
            'email' => $employer->email,
        ])
        ->assertRedirect(route('employer.profile'))
        ->assertSessionHasErrors('organization_type');
});

test('employer portal uses inclusive organization profile labels', function () {
    $english = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $arabic = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($english['employer.profile.title'])->toBe('Organization Profile')
        ->and($english['employer.nav.company_profile'])->toBe('Organization Profile')
        ->and($english['employer.dashboard.company_profile'])->toBe('Organization Profile')
        ->and($english['employer.profile.organization_type.ngo'])->toBe('NGO')
        ->and($english['employer.profile.organization_type.non_profit'])->toBe('Non-Profit Organization')
        ->and($english['employer.profile.organization_type.public_sector'])->toBe('Public Sector')
        ->and($arabic['employer.profile.title'])->toBe('ملف المنظمة')
        ->and($arabic['employer.nav.company_profile'])->toBe('ملف المنظمة')
        ->and($arabic['employer.profile.organization_type.ngo'])->toBe('منظمة غير حكومية');
});
