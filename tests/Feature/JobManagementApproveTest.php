<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;

test('approving a pending job with a past expiry date keeps it active', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->pending()->create([
        'expires_at' => now()->subDays(5),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.jobs.approve', $job))
        ->assertRedirect();

    $job = $job->fresh();

    expect($job)->not->toBeNull()
        ->and($job?->status)->toBe(JobPostStatus::Active)
        ->and($job?->effectiveStatus())->toBe(JobPostStatus::Active)
        ->and($job?->expires_at?->isFuture())->toBeTrue();
});

test('approving a pending job keeps a future expiry date', function () {
    $admin = User::factory()->admin()->create();
    $expiresAt = now()->addDays(12);
    $job = JobPost::factory()->pending()->create([
        'expires_at' => $expiresAt,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.jobs.approve', $job))
        ->assertRedirect();

    $job = $job->fresh();

    expect($job?->status)->toBe(JobPostStatus::Active)
        ->and($job?->effectiveStatus())->toBe(JobPostStatus::Active)
        ->and($job?->expires_at?->toDateString())->toBe($expiresAt->toDateString());
});

test('an active job is not treated as expired until the end of its expiry day', function () {
    $job = JobPost::factory()->create([
        'status' => JobPostStatus::Active,
        'expires_at' => now()->startOfDay(),
    ]);

    expect($job->effectiveStatus())->toBe(JobPostStatus::Active)
        ->and(JobPost::query()->active()->whereKey($job->id)->exists())->toBeTrue();
});
