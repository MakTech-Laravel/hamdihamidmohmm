<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        $required = collect($permissions)
            ->flatMap(fn (string $permission) => preg_split('/[|,]/', $permission) ?: [])
            ->map(fn (string $permission) => trim($permission))
            ->filter()
            ->unique()
            ->values()
            ->all();

        foreach ($required as $permission) {
            if ($user->can($permission)) {
                return $next($request);
            }
        }

        if ($required === []) {
            return $next($request);
        }

        abort(403);
    }
}
