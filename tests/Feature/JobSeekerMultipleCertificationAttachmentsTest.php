<?php

use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('job seekers can attach multiple certificate files without replacing previous ones', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'certifications' => [
            [
                'name' => 'AWS Certified Developer',
                'issuer' => 'Amazon',
                'date' => '2024-03',
            ],
        ],
    ]);

    $first = UploadedFile::fake()->createWithContent('aws-cert.pdf', '%PDF-1.4 first');
    $second = UploadedFile::fake()->createWithContent('aws-badge.pdf', '%PDF-1.4 second');

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.certifications.upload'), [
            'index' => 0,
            'name' => 'AWS Certified Developer',
            'issuer' => 'Amazon',
            'date' => '2024-03',
            'document' => $first,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.certifications.upload'), [
            'index' => 0,
            'name' => 'AWS Certified Developer',
            'issuer' => 'Amazon',
            'date' => '2024-03',
            'document' => $second,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $entry = $seeker->fresh()->jobSeekerProfile?->certifications[0] ?? [];
    $attachments = $entry['attachments'] ?? [];

    expect($attachments)->toHaveCount(2)
        ->and($attachments[0]['file_name'] ?? null)->toBe('aws-cert.pdf')
        ->and($attachments[1]['file_name'] ?? null)->toBe('aws-badge.pdf')
        ->and(Storage::disk('local')->exists((string) $attachments[0]['file_path']))->toBeTrue()
        ->and(Storage::disk('local')->exists((string) $attachments[1]['file_path']))->toBeTrue();

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('profile.certifications.0.attachments.0.file_name', 'aws-cert.pdf')
            ->where('profile.certifications.0.attachments.1.file_name', 'aws-badge.pdf')
            ->where(
                'profile.certifications.0.attachments.1.file_url',
                route('job-seeker.profile.certifications.download', ['index' => 0, 'attachment' => 1]),
            ));

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile.certifications.download', ['index' => 0, 'attachment' => 1]))
        ->assertOk()
        ->assertDownload('aws-badge.pdf');

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->delete(route('job-seeker.profile.certifications.destroy', ['index' => 0]), [
            'attachment' => 0,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $entry = $seeker->fresh()->jobSeekerProfile?->certifications[0] ?? [];
    $attachments = $entry['attachments'] ?? [];

    expect($attachments)->toHaveCount(1)
        ->and($attachments[0]['file_name'] ?? null)->toBe('aws-badge.pdf');
});
