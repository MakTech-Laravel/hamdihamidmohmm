<?php

use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('job seekers can upload and remove a profile photo', function () {
    Storage::fake('public');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $photo = UploadedFile::fake()->image('avatar.png', 300, 300);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.photo.upload'), [
            'photo' => $photo,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();

    expect($seeker->avatar)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $seeker->avatar))->toBeTrue();

    $expectedUrl = '/storage/'.$seeker->avatar;

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('profile.photo_url', $expectedUrl));

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->delete(route('job-seeker.profile.photo.destroy'))
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();

    expect($seeker->avatar)->toBeNull();
});

test('job seekers can upload download and remove certification files', function () {
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

    $document = UploadedFile::fake()->createWithContent(
        'aws-cert.pdf',
        '%PDF-1.4 certification',
    );

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.certifications.upload'), [
            'index' => 0,
            'name' => 'AWS Certified Developer',
            'issuer' => 'Amazon',
            'date' => '2024-03',
            'document' => $document,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $profile = $seeker->fresh()->jobSeekerProfile;
    $entry = $profile?->certifications[0] ?? null;

    expect($entry['attachments'][0]['file_name'] ?? null)->toBe('aws-cert.pdf')
        ->and($entry['attachments'][0]['file_path'] ?? null)->not->toBeNull()
        ->and(Storage::disk('local')->exists((string) ($entry['attachments'][0]['file_path'] ?? '')))->toBeTrue();

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('profile.certifications.0.file_name', 'aws-cert.pdf')
            ->where('profile.certifications.0.attachments.0.file_name', 'aws-cert.pdf')
            ->where('profile.certifications.0.file_url', route('job-seeker.profile.certifications.download', ['index' => 0, 'attachment' => 0])));

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile.certifications.download', ['index' => 0, 'attachment' => 0]))
        ->assertOk()
        ->assertDownload('aws-cert.pdf');

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->delete(route('job-seeker.profile.certifications.destroy', ['index' => 0]), [
            'attachment' => 0,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $entry = $seeker->fresh()->jobSeekerProfile?->certifications[0] ?? [];

    expect($entry['attachments'] ?? [])->toBe([])
        ->and($entry['name'] ?? null)->toBe('AWS Certified Developer');
});

test('saving certifications preserves uploaded certificate files', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Noura',
        'phone' => '+971 50 000 0000',
        'location' => 'Dubai',
    ]);

    $path = 'certifications/'.$seeker->id.'/saved.pdf';
    Storage::disk('local')->put($path, '%PDF-1.4 saved');

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'certifications' => [
            [
                'name' => 'PMP',
                'issuer' => 'PMI',
                'date' => '2023',
                'attachments' => [
                    [
                        'file_path' => $path,
                        'file_name' => 'saved.pdf',
                    ],
                ],
            ],
        ],
    ]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Noura',
            'phone' => '+971 50 000 0000',
            'location' => 'Dubai',
            'certifications' => [
                [
                    'name' => 'PMP Updated',
                    'issuer' => 'PMI',
                    'date' => '2023',
                    'attachments' => [
                        [
                            'file_path' => $path,
                            'file_name' => 'saved.pdf',
                        ],
                    ],
                ],
            ],
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $entry = $seeker->fresh()->jobSeekerProfile?->certifications[0] ?? [];

    expect($entry['name'] ?? null)->toBe('PMP Updated')
        ->and($entry['attachments'][0]['file_path'] ?? null)->toBe($path)
        ->and(Storage::disk('local')->exists($path))->toBeTrue();
});
