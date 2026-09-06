<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Symfony\Component\HttpFoundation\Response;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        $redirect = $user?->isJobSeeker() === true
            ? route('job-seeker.profile')
            : route($user?->dashboardRoute() ?? 'job-seeker.dashboard');

        return $request->wantsJson()
            ? new JsonResponse('', 201)
            : redirect()->intended($redirect);
    }
}
