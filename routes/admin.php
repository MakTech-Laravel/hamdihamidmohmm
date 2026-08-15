<?php

use App\Enums\RoleName;
use App\Http\Controllers\Backend\Admin\AdminDashboardController;
use App\Http\Controllers\Backend\Admin\AdminManagementController;
use App\Http\Controllers\Backend\Admin\AdminPortalModuleController;
use App\Http\Controllers\Backend\Admin\EmployerManagementController;
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
        'admin.panel',
    ])->group(function () {
        Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
        Route::get('/users/list', [UserSelectionController::class, 'getUsers'])->name('users.list');

        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserManagementController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserManagementController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');

        Route::get('/roles-permissions', [RolePermissionController::class, 'index'])->name('roles-permissions.index');

        Route::get('/employers/export', [EmployerManagementController::class, 'export'])->name('employers.export');
        Route::get('/employers/create', [EmployerManagementController::class, 'create'])->name('employers.create');
        Route::get('/employers', [EmployerManagementController::class, 'index'])->name('employers.index');
        Route::post('/employers', [EmployerManagementController::class, 'store'])->name('employers.store');
        Route::get('/employers/{user}', [EmployerManagementController::class, 'show'])->name('employers.show');
        Route::get('/employers/{user}/edit', [EmployerManagementController::class, 'edit'])->name('employers.edit');
        Route::put('/employers/{user}', [EmployerManagementController::class, 'update'])->name('employers.update');
        Route::post('/employers/{user}/approve', [EmployerManagementController::class, 'approve'])->name('employers.approve');
        Route::post('/employers/{user}/reject', [EmployerManagementController::class, 'reject'])->name('employers.reject');

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

            Route::get('/roles-permissions/create', [RolePermissionController::class, 'create'])->name('roles-permissions.create');
            Route::post('/roles-permissions', [RolePermissionController::class, 'store'])->name('roles-permissions.store');
            Route::get('/roles-permissions/{role}/edit', [RolePermissionController::class, 'edit'])->name('roles-permissions.edit');
            Route::put('/roles-permissions/{role}', [RolePermissionController::class, 'update'])->name('roles-permissions.update');
            Route::delete('/roles-permissions/{role}', [RolePermissionController::class, 'destroy'])->name('roles-permissions.destroy');
        });

        Route::get('/roles-permissions/{role}', [RolePermissionController::class, 'show'])->name('roles-permissions.show');
    });
});
