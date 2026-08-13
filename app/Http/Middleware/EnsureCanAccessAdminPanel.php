<?php

namespace App\Http\Middleware;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanAccessAdminPanel
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        if (
            $user->can(PermissionName::AccessAdminPanel->value)
            || $user->hasAnyRole(RoleName::adminPanelValues())
        ) {
            return $next($request);
        }

        return redirect()->route($user->dashboardRoute());
    }
}
