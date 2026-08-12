<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerApplicationsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/User/JobSeekerApplications', [
            'user' => $request->user()->only(['id', 'name', 'email', 'role', 'role_label']),
        ]);
    }
}
