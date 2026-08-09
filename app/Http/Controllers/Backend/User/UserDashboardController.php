<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserDashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        return redirect()->route($request->user()->dashboardRoute());
    }
}
