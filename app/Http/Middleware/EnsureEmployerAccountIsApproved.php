<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmployerAccountIsApproved
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->isEmployer() !== true) {
            return $next($request);
        }

        if ($user->employerAccountAllowsLogin()) {
            return $next($request);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $message = $user->employerLoginDenialReason()
            ?? 'Your employer account is awaiting admin approval.';

        return redirect()
            ->route('login')
            ->withErrors(['email' => $message]);
    }
}
