<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RegisterRoleController extends Controller
{
    public function __invoke(Request $request, string $role): Response|SymfonyResponse
    {
        $normalizedRole = match ($role) {
            'job-seeker' => UserRole::JobSeeker,
            'employer' => UserRole::Employer,
            default => null,
        };

        if ($normalizedRole === null) {
            return redirect()->route('register');
        }

        return Inertia::render('auth/register-form', [
            'role' => $normalizedRole->value,
            'roleLabel' => $normalizedRole->label(),
            'isEmployer' => $normalizedRole === UserRole::Employer,
        ]);
    }
}
