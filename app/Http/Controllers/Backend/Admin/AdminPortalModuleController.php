<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPortalModuleController extends Controller
{
    public function employers(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/EmployerManagement');
    }

    public function jobSeekers(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/JobSeekerManagement');
    }

    public function jobs(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/JobManagement');
    }

    public function applications(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/ApplicationsMonitoring');
    }

    public function packages(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/PackagesPricing');
    }

    public function payments(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/PaymentsRevenue');
    }

    public function verifications(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/VerificationCenter');
    }

    public function reports(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/ReportsAnalytics');
    }

    public function content(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/ContentManagement');
    }

    public function notifications(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/AdminNotifications');
    }

    public function settings(Request $request): Response
    {
        return $this->page($request, 'backend/Admin/PlatformSettings');
    }

    private function page(Request $request, string $component): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        return Inertia::render($component);
    }
}
