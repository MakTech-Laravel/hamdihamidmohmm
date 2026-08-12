<?php

use App\Models\User;

test('admins can view the designed admin dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AdminDashboard')
            ->has('stats')
            ->has('recentUsers')
            ->has('alerts'));
});

test('job seekers cannot view the admin dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});
