<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EmployerPortalPageController extends Controller
{
    public function profile(): Response
    {
        return Inertia::render('backend/User/EmployerCompanyProfile');
    }

    public function packages(): Response
    {
        return Inertia::render('backend/User/EmployerPackages');
    }

    public function jobs(): Response
    {
        return Inertia::render('backend/User/EmployerJobs');
    }

    public function applications(): Response
    {
        return Inertia::render('backend/User/EmployerApplications');
    }

    public function notifications(): Response
    {
        return Inertia::render('backend/User/EmployerNotifications');
    }

    public function settings(): Response
    {
        return Inertia::render('backend/User/EmployerSettings');
    }
}
