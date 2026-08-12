<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreAdminRequest;
use App\Models\User;
use App\Support\RoleAssigner;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminManagementController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()?->canManageAdmins(), 403);

        $admins = User::query()
            ->role([UserRole::Admin->spatieName(), UserRole::SuperAdmin->spatieName()])
            ->latest()
            ->get(['id', 'name', 'email', 'role', 'created_at'])
            ->map(fn (User $admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role?->value,
                'role_label' => $admin->role_label,
                'created_at' => $admin->created_at?->toDateString(),
            ]);

        return Inertia::render('backend/Admin/AdminManagement', [
            'admins' => $admins,
            'canCreateAdmins' => true,
        ]);
    }

    public function store(StoreAdminRequest $request): RedirectResponse
    {
        $admin = User::create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'email_verified_at' => now(),
            'role' => UserRole::Admin,
        ]);

        RoleAssigner::assign($admin, UserRole::Admin);

        return redirect()
            ->route('admin.admins.index')
            ->with('success', 'Admin account created successfully.');
    }
}
