<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Symfony\Component\HttpFoundation\Response;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        if ($user?->isEmployer() === true) {
            Auth::logout();

            $message = 'Your employer account was created and is awaiting admin approval. You can sign in after an administrator approves it.';

            return $request->wantsJson()
                ? new JsonResponse(['message' => $message], 201)
                : redirect()->route('login')->with('status', $message);
        }

        $redirect = $user?->isJobSeeker() === true
            ? route('job-seeker.profile')
            : route($user?->dashboardRoute() ?? 'job-seeker.dashboard');

        return $request->wantsJson()
            ? new JsonResponse('', 201)
            : redirect()->intended($redirect);
    }
}
