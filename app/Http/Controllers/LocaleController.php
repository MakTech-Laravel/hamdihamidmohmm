<?php

namespace App\Http\Controllers;

use App\Support\Locale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(Locale::supported())],
        ]);

        $locale = Locale::normalize($validated['locale']);

        App::setLocale($locale);
        $request->session()->put(Locale::COOKIE, $locale);

        return back()->withCookie(cookie()->forever(Locale::COOKIE, $locale));
    }
}
