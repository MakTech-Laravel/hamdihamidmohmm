<?php

use App\Models\PlatformSetting;
use App\Models\User;
use App\Support\TrainingMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('admins can view the training media page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.training.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/TrainingMedia')
            ->where('heroVideoUrl', null)
            ->where('videos', [])
            ->where('documents', [])
            ->where('maxVideos', 12));
});

test('admins can upload multiple training videos for the public slider', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $first = UploadedFile::fake()->create('intro.mp4', 1024, 'video/mp4');
    $second = UploadedFile::fake()->create('payments.webm', 800, 'video/webm');

    $this->actingAs($admin)
        ->post(route('admin.training.video.store'), [
            'video' => $first,
            'name' => 'Getting started',
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->post(route('admin.training.video.store'), [
            'videos' => [$second],
        ])
        ->assertRedirect();

    $videos = TrainingMedia::videos();

    expect($videos)->toHaveCount(2)
        ->and($videos[0]['name'])->toBe('Getting started')
        ->and($videos[1]['file_name'])->toBe('payments.webm')
        ->and(TrainingMedia::heroVideoUrl())->toBe($videos[0]['url']);

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/training')
            ->has('videos', 2)
            ->where('videos.0.name', 'Getting started')
            ->where('videos.1.file_name', 'payments.webm')
            ->where('heroVideoUrl', TrainingMedia::heroVideoUrl()));

    $this->actingAs($admin)
        ->get(route('admin.training.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('videos', 2)
            ->where('videos.0.name', 'Getting started'));

    $this->actingAs($admin)
        ->delete(route('admin.training.videos.destroy', $videos[0]['id']))
        ->assertRedirect();

    expect(TrainingMedia::videos())->toHaveCount(1)
        ->and(TrainingMedia::videos()[0]['file_name'])->toBe('payments.webm');
});

test('admins can upload and remove the training hero video', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $video = UploadedFile::fake()->create('intro.mp4', 1024, 'video/mp4');

    $this->actingAs($admin)
        ->post(route('admin.training.video.store'), [
            'video' => $video,
        ])
        ->assertRedirect();

    $path = TrainingMedia::heroVideoPath();

    $videos = TrainingMedia::videos();

    expect($path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $path))->toBeTrue()
        ->and($videos)->toHaveCount(1)
        ->and(TrainingMedia::heroVideoUrl())->toBe(TrainingMedia::streamUrl($videos[0]['id']));

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', TrainingMedia::heroVideoUrl())
            ->has('videos', 1)
            ->where('documents', []));

    $this->actingAs($admin)
        ->delete(route('admin.training.video.destroy'))
        ->assertRedirect();

    expect(TrainingMedia::heroVideoPath())->toBeNull()
        ->and(TrainingMedia::heroVideoUrl())->toBeNull()
        ->and(TrainingMedia::videos())->toBe([]);
});

test('admins can upload and remove training documents without clearing the video', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $video = UploadedFile::fake()->create('intro.mp4', 1024, 'video/mp4');
    $document = UploadedFile::fake()->create('guide.pdf', 512, 'application/pdf');

    $this->actingAs($admin)
        ->post(route('admin.training.video.store'), [
            'video' => $video,
        ])
        ->assertRedirect();

    $videoPath = TrainingMedia::heroVideoPath();

    $this->actingAs($admin)
        ->post(route('admin.training.documents.store'), [
            'document' => $document,
            'name' => 'Application Guide',
        ])
        ->assertRedirect();

    $documents = TrainingMedia::documents();

    expect($documents)->toHaveCount(1)
        ->and($documents[0]['name'])->toBe('Application Guide')
        ->and($documents[0]['file_name'])->toBe('guide.pdf')
        ->and($documents[0]['url'])->toStartWith('/storage/')
        ->and(TrainingMedia::heroVideoPath())->toBe($videoPath)
        ->and(TrainingMedia::videos())->toHaveCount(1);

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', TrainingMedia::heroVideoUrl())
            ->has('videos', 1)
            ->has('documents', 1)
            ->where('documents.0.name', 'Application Guide'));

    $this->actingAs($admin)
        ->get(route('admin.training.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/TrainingMedia')
            ->has('documents', 1)
            ->where('documents.0.name', 'Application Guide'));

    $this->actingAs($admin)
        ->delete(route('admin.training.documents.destroy', $documents[0]['id']))
        ->assertRedirect();

    expect(TrainingMedia::documents())->toBe([])
        ->and(TrainingMedia::heroVideoPath())->toBe($videoPath);
});

test('legacy single hero video still appears in the training slider', function () {
    Storage::fake('public');

    $path = 'training/legacy.mp4';
    Storage::disk('public')->put($path, 'video');

    PlatformSetting::query()->updateOrCreate(
        ['key' => TrainingMedia::SETTING_KEY],
        ['value' => ['hero_video_path' => $path, 'documents' => []]],
    );

    $url = TrainingMedia::streamUrl(TrainingMedia::videos()[0]['id']);

    expect(TrainingMedia::videos())->toHaveCount(1)
        ->and(TrainingMedia::videos()[0]['url'])->toBe($url)
        ->and(TrainingMedia::heroVideoUrl())->toBe($url);

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('videos', 1)
            ->where('videos.0.url', $url));
});

test('training videos can be seeked with http range requests', function () {
    Storage::fake('public');

    $path = 'training/videos/intro.mp4';
    Storage::disk('public')->put($path, str_repeat('a', 2048));

    PlatformSetting::query()->updateOrCreate(
        ['key' => TrainingMedia::SETTING_KEY],
        ['value' => [
            'hero_video_path' => $path,
            'videos' => [[
                'id' => 'video-1',
                'name' => 'Intro',
                'file_name' => 'intro.mp4',
                'path' => $path,
                'mime' => 'video/mp4',
                'size' => 2048,
            ]],
            'documents' => [],
        ]],
    );

    $this->get(route('training.videos.show', 'video-1'))
        ->assertOk()
        ->assertHeader('Accept-Ranges', 'bytes');

    $this->withHeaders(['Range' => 'bytes=0-10'])
        ->get(route('training.videos.show', 'video-1'))
        ->assertStatus(206)
        ->assertHeader('Accept-Ranges', 'bytes');

    $this->get(route('training.videos.show', 'missing-video'))
        ->assertNotFound();
});

test('job seekers cannot manage training media', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.training.index'))
        ->assertRedirect();
});

test('training page includes hero video url prop when empty', function () {
    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', null)
            ->where('videos', [])
            ->where('documents', []));
});
