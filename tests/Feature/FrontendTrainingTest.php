<?php

test('training page can be rendered', function () {
    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/training'));
});

test('training page shares training translations', function () {
    $this->get(route('training'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['training.title'] ?? null) === 'Training & Tutorials'
                && ($translations['nav.training'] ?? null) === 'Training'
                && ($translations['training.coming_soon'] ?? null) === 'Tutorials coming soon'
                && ($translations['training.video_placeholder'] ?? null) === 'Training video will appear here')
            ->where('heroVideoUrl', null));
});
