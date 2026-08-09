<?php

namespace App\Http\Middleware;

use App\Support\Locale;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = Locale::normalize(
            $request->session()->get(Locale::COOKIE)
                ?? $request->cookie(Locale::COOKIE)
                ?? config('app.locale')
        );

        App::setLocale($locale);
        $request->session()->put(Locale::COOKIE, $locale);

        View::share('locale', $locale);
        View::share('dir', Locale::direction($locale));

        return $next($request);
    }
}
