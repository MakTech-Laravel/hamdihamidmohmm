<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        $requiredRole = UserRole::from((int) $role);

        if ($user === null || $user->role !== $requiredRole) {
            if ($user !== null) {
                return redirect()->route($user->dashboardRoute());
            }

            return redirect()->route('login');
        }

        return $next($request);
    }
}
