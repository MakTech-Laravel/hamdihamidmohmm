<?php

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
            ->where('documents', []));
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

    expect($path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $path))->toBeTrue()
        ->and(TrainingMedia::heroVideoUrl())->toBe('/storage/' . $path);

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', TrainingMedia::heroVideoUrl())
            ->where('documents', []));

    $this->actingAs($admin)
        ->delete(route('admin.training.video.destroy'))
        ->assertRedirect();

    expect(TrainingMedia::heroVideoPath())->toBeNull()
        ->and(TrainingMedia::heroVideoUrl())->toBeNull();
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
        ->and(TrainingMedia::heroVideoPath())->toBe($videoPath);

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', TrainingMedia::heroVideoUrl())
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
            ->where('documents', []));
});
