<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        if ($user !== null && ($denial = $user->employerLoginDenialReason()) !== null) {
            Auth::logout();

            throw ValidationException::withMessages([
                Fortify::username() => $denial,
            ]);
        }

        $redirect = $user?->isJobSeeker() === true
            ? route('job-seeker.profile')
            : route($user?->dashboardRoute() ?? 'job-seeker.dashboard');

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false], 200)
            : redirect()->intended($redirect);
    }
}
