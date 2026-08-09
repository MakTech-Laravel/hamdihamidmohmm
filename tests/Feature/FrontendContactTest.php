<?php

test('contact page can be rendered', function () {
    $this->get(route('contact'))
        ->assertOk()
        ->assertInertia(fn($page) => $page->component('frontend/contact'));
});

test('contact page shares contact translations', function () {
    $this->get(route('contact'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('translations')
            ->where('translations', fn($translations) => ($translations['contact.title'] ?? null) === 'Contact Us'
                && ($translations['contact.form_title'] ?? null) === 'Send us a Message'));
});

test('contact form can be submitted successfully', function () {
    $this->from(route('contact'))
        ->post(route('contact.store'), [
            'name' => 'Sara Ahmed',
            'email' => 'sara@example.com',
            'phone' => '+966500000000',
            'message' => 'I would like to know more about employer packages.',
        ])
        ->assertRedirect(route('contact'))
        ->assertSessionHas('success', true);
});

test('contact form allows optional phone number', function () {
    $this->from(route('contact'))
        ->post(route('contact.store'), [
            'name' => 'Sara Ahmed',
            'email' => 'sara@example.com',
            'message' => 'Hello from the contact form.',
        ])
        ->assertRedirect(route('contact'))
        ->assertSessionHas('success', true)
        ->assertSessionDoesntHaveErrors(['phone']);
});

test('contact form requires name email and message', function () {
    $this->from(route('contact'))
        ->post(route('contact.store'), [])
        ->assertRedirect(route('contact'))
        ->assertSessionHasErrors(['name', 'email', 'message']);
});

test('contact form rejects messages longer than 500 characters', function () {
    $this->from(route('contact'))
        ->post(route('contact.store'), [
            'name' => 'Sara Ahmed',
            'email' => 'sara@example.com',
            'message' => str_repeat('a', 501),
        ])
        ->assertRedirect(route('contact'))
        ->assertSessionHasErrors(['message']);
});
