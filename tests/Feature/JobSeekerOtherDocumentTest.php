<?php

use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('job seekers can upload download and remove an other document', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $document = UploadedFile::fake()->createWithContent(
        'portfolio.pdf',
        '%PDF-1.4 other-document',
    );

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.other-document.upload'), [
            'other_document' => $document,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();

    expect($seeker->other_document_original_name)->toBe('portfolio.pdf')
        ->and($seeker->other_document_path)->not->toBeNull()
        ->and(Storage::disk('local')->exists((string) $seeker->other_document_path))->toBeTrue();

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('profile.other_document_name', 'portfolio.pdf')
            ->where('profile.other_document_url', route('job-seeker.profile.other-document.download')));

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile.other-document.download'))
        ->assertOk()
        ->assertDownload('portfolio.pdf');

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->delete(route('job-seeker.profile.other-document.destroy'))
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();

    expect($seeker->other_document_path)->toBeNull()
        ->and($seeker->other_document_original_name)->toBeNull();
});

test('resume documents section is last in the job seeker profile checklist', function () {
    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('profile.checklist.7.id', 'resume')
            ->where('profile.checklist.0.id', 'personal'));
});
