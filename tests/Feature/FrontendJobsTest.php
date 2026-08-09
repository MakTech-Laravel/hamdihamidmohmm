<?php

test('jobs page can be rendered', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/jobs'));
});

test('jobs page shares locale translations', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['jobs_page.title'] ?? null) === 'Find Your Next Opportunity'));
});
