<?php

test('pricing page can be rendered', function () {
    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/pricing'));
});

test('pricing page shares package translations', function () {
    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['pricing.title'] ?? null) === 'Choose the Right Package'
                && ($translations['pricing.business.name'] ?? null) === 'Business Package'));
});
