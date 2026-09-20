<?php

use App\Enums\EmployerVerificationStatus;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('employers can upload replace and remove company logo cover and verification document', function () {
    Storage::fake('public');
    Storage::fake('local');

    $employer = User::factory()->employer()->create();

    $logo = UploadedFile::fake()->image('logo.png', 200, 200);
    $cover = UploadedFile::fake()->image('cover.jpg', 1200, 400);
    $document = UploadedFile::fake()->createWithContent(
        'trade-license.pdf',
        '%PDF-1.4 cr-document',
    );

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->post(route('employer.profile.logo.upload'), ['logo' => $logo])
        ->assertRedirect(route('employer.profile'));

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->post(route('employer.profile.cover.upload'), ['cover' => $cover])
        ->assertRedirect(route('employer.profile'));

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->post(route('employer.profile.verification-document.upload'), [
            'document' => $document,
        ])
        ->assertRedirect(route('employer.profile'));

    $employer->refresh();

    expect($employer->company_logo_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $employer->company_logo_path))->toBeTrue()
        ->and($employer->company_cover_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $employer->company_cover_path))->toBeTrue()
        ->and($employer->verification_document_original_name)->toBe('trade-license.pdf')
        ->and(Storage::disk('local')->exists((string) $employer->verification_document_path))->toBeTrue();

    $this->actingAs($employer)
        ->get(route('employer.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerCompanyProfile')
            ->where('completion.sections.logo', true)
            ->where('completion.sections.cover', true)
            ->where('completion.sections.verification', true)
            ->where('profile.verification_document_name', 'trade-license.pdf')
            ->where('profile.logo_url', $employer->companyLogoUrl())
            ->where('profile.cover_url', $employer->companyCoverUrl()));

    $this->actingAs($employer)
        ->get(route('employer.profile.verification-document.download'))
        ->assertOk()
        ->assertDownload('trade-license.pdf');

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->delete(route('employer.profile.logo.destroy'))
        ->assertRedirect(route('employer.profile'));

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->delete(route('employer.profile.cover.destroy'))
        ->assertRedirect(route('employer.profile'));

    $this->actingAs($employer)
        ->from(route('employer.profile'))
        ->delete(route('employer.profile.verification-document.destroy'))
        ->assertRedirect(route('employer.profile'));

    $employer->refresh();

    expect($employer->company_logo_path)->toBeNull()
        ->and($employer->company_cover_path)->toBeNull()
        ->and($employer->verification_document_path)->toBeNull()
        ->and($employer->verification_document_original_name)->toBeNull();
});

test('approved employers mark verification complete even without a document file', function () {
    $employer = User::factory()->employer()->create([
        'verification_status' => EmployerVerificationStatus::Approved,
        'verified_at' => now(),
    ]);

    $this->actingAs($employer)
        ->get(route('employer.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('completion.sections.verification', true)
            ->where('completion.sections.logo', false)
            ->where('completion.sections.cover', false));
});
