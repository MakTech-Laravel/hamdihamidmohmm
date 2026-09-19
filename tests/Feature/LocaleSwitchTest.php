<?php

use App\Support\Locale;

test('locale can be switched to arabic', function () {
    $this->from(route('discover'))
        ->post(route('locale.update'), ['locale' => Locale::ARABIC])
        ->assertRedirect(route('discover'))
        ->assertCookie(Locale::COOKIE, Locale::ARABIC, false);

    $this->assertSame(Locale::ARABIC, session(Locale::COOKIE));
});

test('locale can be switched to english', function () {
    session([Locale::COOKIE => Locale::ARABIC]);

    $this->from(route('discover'))
        ->post(route('locale.update'), ['locale' => Locale::ENGLISH])
        ->assertRedirect(route('discover'))
        ->assertCookie(Locale::COOKIE, Locale::ENGLISH, false);

    $this->assertSame(Locale::ENGLISH, session(Locale::COOKIE));
});

test('unsupported locale is rejected', function () {
    $this->from(route('discover'))
        ->post(route('locale.update'), ['locale' => 'fr'])
        ->assertSessionHasErrors('locale');
});

test('inertia shares locale direction and translations', function () {
    $this->withUnencryptedCookie(Locale::COOKIE, Locale::ARABIC)
        ->withSession([Locale::COOKIE => Locale::ARABIC])
        ->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', Locale::ARABIC)
            ->where('dir', 'rtl')
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['nav.discover'] ?? null) === 'اكتشف')
            ->has('availableLocales', 2));
});

test('english locale shares ltr direction', function () {
    $this->withSession([Locale::COOKIE => Locale::ENGLISH])
        ->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', Locale::ENGLISH)
            ->where('dir', 'ltr')
            ->where('translations', fn ($translations) => ($translations['nav.discover'] ?? null) === 'Discover'));
});
