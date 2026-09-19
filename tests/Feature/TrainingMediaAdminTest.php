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
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/TrainingMedia')
            ->where('heroVideoUrl', null));
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
        ->and(TrainingMedia::heroVideoUrl())->toBe('/storage/'.$path);

    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', TrainingMedia::heroVideoUrl()));

    $this->actingAs($admin)
        ->delete(route('admin.training.video.destroy'))
        ->assertRedirect();

    expect(TrainingMedia::heroVideoPath())->toBeNull()
        ->and(TrainingMedia::heroVideoUrl())->toBeNull();
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
        ->assertInertia(fn ($page) => $page
            ->component('frontend/training')
            ->where('heroVideoUrl', null));
});
