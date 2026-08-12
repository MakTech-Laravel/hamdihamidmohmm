<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerSettingsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/User/JobSeekerSettings', [
            'user' => $request->user()->only(['id', 'name', 'email', 'role', 'role_label']),
        ]);
    }
}
