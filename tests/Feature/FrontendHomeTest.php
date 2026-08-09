<?php

use App\Models\User;

test('home page can be rendered', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/home'));
});

test('authenticated users can still view the home page', function () {
    $user = User::factory()->jobSeeker()->create();

    $this->actingAs($user)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/home'));
});
