<?php

use App\Support\Locale;

test('locale can be switched to arabic', function () {
    $this->from(route('home'))
        ->post(route('locale.update'), ['locale' => Locale::ARABIC])
        ->assertRedirect(route('home'))
        ->assertCookie(Locale::COOKIE, Locale::ARABIC, false);

    $this->assertSame(Locale::ARABIC, session(Locale::COOKIE));
});

test('locale can be switched to english', function () {
    session([Locale::COOKIE => Locale::ARABIC]);

    $this->from(route('home'))
        ->post(route('locale.update'), ['locale' => Locale::ENGLISH])
        ->assertRedirect(route('home'))
        ->assertCookie(Locale::COOKIE, Locale::ENGLISH, false);

    $this->assertSame(Locale::ENGLISH, session(Locale::COOKIE));
});

test('unsupported locale is rejected', function () {
    $this->from(route('home'))
        ->post(route('locale.update'), ['locale' => 'fr'])
        ->assertSessionHasErrors('locale');
});

test('inertia shares locale direction and translations', function () {
    $this->withUnencryptedCookie(Locale::COOKIE, Locale::ARABIC)
        ->withSession([Locale::COOKIE => Locale::ARABIC])
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', Locale::ARABIC)
            ->where('dir', 'rtl')
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['nav.home'] ?? null) === 'الرئيسية')
            ->has('availableLocales', 2));
});

test('english locale shares ltr direction', function () {
    $this->withSession([Locale::COOKIE => Locale::ENGLISH])
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', Locale::ENGLISH)
            ->where('dir', 'ltr')
            ->where('translations', fn ($translations) => ($translations['nav.home'] ?? null) === 'Home'));
});
