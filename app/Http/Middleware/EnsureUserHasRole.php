<?php

namespace App\Http\Middleware;

use App\Enums\RoleName;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        $requiredRoles = collect($roles)
            ->flatMap(fn (string $role) => preg_split('/[|,]/', $role) ?: [])
            ->map(fn (string $role) => trim($role))
            ->filter()
            ->map(fn (string $role) => $this->normalizeRole($role))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($requiredRoles === [] || ! $user->hasAnyRole($requiredRoles)) {
            return redirect()->route($user->dashboardRoute());
        }

        return $next($request);
    }

    private function normalizeRole(string $role): ?string
    {
        if (RoleName::tryFrom($role) instanceof RoleName) {
            return $role;
        }

        if (ctype_digit($role)) {
            return UserRole::from((int) $role)->spatieName();
        }

        return null;
    }
}
