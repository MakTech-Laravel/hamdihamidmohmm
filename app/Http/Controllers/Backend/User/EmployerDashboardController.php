<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/User/EmployerDashboard', [
            'user' => $request->user()?->only([
                'id',
                'name',
                'email',
                'company_name',
                'role',
                'role_label',
            ]),
        ]);
    }
}
