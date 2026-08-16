<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\EmployerVerificationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerificationCenterController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageVerification(), 403);

        $pending = User::query()
            ->where('role', UserRole::Employer)
            ->where('verification_status', EmployerVerificationStatus::Pending)
            ->latest()
            ->get()
            ->map(fn (User $employer) => [
                'id' => $employer->id,
                'company_name' => $employer->company_name ?: $employer->name,
                'contact' => $employer->contact_name ?: $employer->name,
                'email' => $employer->email,
                'industry' => $employer->industry ?: '—',
                'created_at' => $employer->created_at?->toDateString(),
                'can_review' => true,
            ]);

        $base = User::query()->where('role', UserRole::Employer);

        return Inertia::render('backend/Admin/VerificationCenter', [
            'pending' => $pending,
            'stats' => [
                'pending' => (clone $base)->where('verification_status', EmployerVerificationStatus::Pending)->count(),
                'approved' => (clone $base)->where('verification_status', EmployerVerificationStatus::Approved)->count(),
                'rejected' => (clone $base)->where('verification_status', EmployerVerificationStatus::Rejected)->count(),
                'total' => (clone $base)->count(),
            ],
        ]);
    }
}
