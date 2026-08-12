<?php

use App\Enums\RoleName;
use App\Http\Controllers\Backend\Admin\AdminDashboardController;
use App\Http\Controllers\Backend\Admin\AdminManagementController;
use App\Http\Controllers\Backend\Admin\AdminPortalModuleController;
use App\Http\Controllers\Backend\Admin\RolePermissionController;
use App\Http\Controllers\Backend\Admin\UserManagementController;
use App\Http\Controllers\UserSelectionController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', function () {
        return redirect()->route('login');
    })->name('login');

    Route::middleware([
        'auth',
        'verified',
        'role:'.RoleName::SuperAdmin->value.','.RoleName::Admin->value,
    ])->group(function () {
        Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
        Route::get('/users/list', [UserSelectionController::class, 'getUsers'])->name('users.list');

        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::put('/users/{user}/role', [UserManagementController::class, 'updateRole'])->name('users.role.update');

        Route::get('/roles-permissions', [RolePermissionController::class, 'index'])->name('roles-permissions.index');

        Route::get('/employers', [AdminPortalModuleController::class, 'employers'])->name('employers.index');
        Route::get('/job-seekers', [AdminPortalModuleController::class, 'jobSeekers'])->name('job-seekers.index');
        Route::get('/jobs', [AdminPortalModuleController::class, 'jobs'])->name('jobs.index');
        Route::get('/applications', [AdminPortalModuleController::class, 'applications'])->name('applications.index');
        Route::get('/packages', [AdminPortalModuleController::class, 'packages'])->name('packages.index');
        Route::get('/payments', [AdminPortalModuleController::class, 'payments'])->name('payments.index');
        Route::get('/verifications', [AdminPortalModuleController::class, 'verifications'])->name('verifications.index');
        Route::get('/reports', [AdminPortalModuleController::class, 'reports'])->name('reports.index');
        Route::get('/content', [AdminPortalModuleController::class, 'content'])->name('content.index');
        Route::get('/notifications', [AdminPortalModuleController::class, 'notifications'])->name('notifications.index');
        Route::get('/settings', [AdminPortalModuleController::class, 'settings'])->name('settings.index');

        Route::middleware('role:'.RoleName::SuperAdmin->value)->group(function () {
            Route::get('/admins', [AdminManagementController::class, 'index'])->name('admins.index');
            Route::post('/admins', [AdminManagementController::class, 'store'])->name('admins.store');
            Route::put('/roles/permissions', [RolePermissionController::class, 'update'])->name('roles.permissions.update');
        });
    });
});
