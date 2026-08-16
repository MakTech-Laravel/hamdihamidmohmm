<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request, AdminDashboardService $dashboard): Response
    {
        return Inertia::render('backend/Admin/AdminDashboard', $dashboard->payload($request));
    }
}
