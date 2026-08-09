<?php

test('about page can be rendered', function () {
    $this->get(route('about'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/about'));
});

test('about page shares about translations', function () {
    $this->get(route('about'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['about.title'] ?? null) === 'About RR Job Portal'
                && ($translations['about.cta_title'] ?? null) === 'Ready to Get Started?'));
});
