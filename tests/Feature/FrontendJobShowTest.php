<?php

test('job detail page can be rendered', function () {
    $this->get(route('jobs.show', 'senior-frontend-developer'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/job-show')
            ->where('job.slug', 'senior-frontend-developer')
            ->where('job.title', 'Senior Frontend Developer')
            ->where('job.company', 'TechCorp Solutions'));
});

test('job detail page returns not found for unknown slug', function () {
    $this->get(route('jobs.show', 'unknown-role'))
        ->assertNotFound();
});

test('job detail page shares job detail translations', function () {
    $this->get(route('jobs.show', 'senior-frontend-developer'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('translations')
            ->where('translations', fn($translations) => ($translations['job_detail.apply_now'] ?? null) === 'Apply Now'
                && ($translations['job_detail.share_via'] ?? null) === 'Share via:'));
});
