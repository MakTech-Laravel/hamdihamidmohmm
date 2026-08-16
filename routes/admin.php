<?php

use App\Enums\RoleName;
use App\Http\Controllers\Backend\Admin\AdminDashboardController;
use App\Http\Controllers\Backend\Admin\AdminManagementController;
use App\Http\Controllers\Backend\Admin\AdminNotificationController;
use App\Http\Controllers\Backend\Admin\ApplicationMonitoringController;
use App\Http\Controllers\Backend\Admin\ContentManagementController;
use App\Http\Controllers\Backend\Admin\EmployerManagementController;
use App\Http\Controllers\Backend\Admin\JobManagementController;
use App\Http\Controllers\Backend\Admin\JobSeekerManagementController;
use App\Http\Controllers\Backend\Admin\PackageManagementController;
use App\Http\Controllers\Backend\Admin\PaymentManagementController;
use App\Http\Controllers\Backend\Admin\PlatformSettingController;
use App\Http\Controllers\Backend\Admin\ReportController;
use App\Http\Controllers\Backend\Admin\RolePermissionController;
use App\Http\Controllers\Backend\Admin\UserManagementController;
use App\Http\Controllers\Backend\Admin\VerificationCenterController;
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

        Route::get('/job-seekers/export', [JobSeekerManagementController::class, 'export'])->name('job-seekers.export');
        Route::get('/job-seekers/create', [JobSeekerManagementController::class, 'create'])->name('job-seekers.create');
        Route::get('/job-seekers', [JobSeekerManagementController::class, 'index'])->name('job-seekers.index');
        Route::post('/job-seekers', [JobSeekerManagementController::class, 'store'])->name('job-seekers.store');
        Route::get('/job-seekers/{user}', [JobSeekerManagementController::class, 'show'])->name('job-seekers.show');
        Route::get('/job-seekers/{user}/edit', [JobSeekerManagementController::class, 'edit'])->name('job-seekers.edit');
        Route::put('/job-seekers/{user}', [JobSeekerManagementController::class, 'update'])->name('job-seekers.update');
        Route::post('/job-seekers/{user}/suspend', [JobSeekerManagementController::class, 'suspend'])->name('job-seekers.suspend');
        Route::post('/job-seekers/{user}/reactivate', [JobSeekerManagementController::class, 'reactivate'])->name('job-seekers.reactivate');
        Route::get('/jobs/export', [JobManagementController::class, 'export'])->name('jobs.export');
        Route::get('/jobs', [JobManagementController::class, 'index'])->name('jobs.index');
        Route::get('/jobs/{jobPost}', [JobManagementController::class, 'show'])->name('jobs.show');
        Route::post('/jobs/{jobPost}/approve', [JobManagementController::class, 'approve'])->name('jobs.approve');
        Route::post('/jobs/{jobPost}/reject', [JobManagementController::class, 'reject'])->name('jobs.reject');
        Route::post('/jobs/{jobPost}/feature', [JobManagementController::class, 'feature'])->name('jobs.feature');

        Route::get('/applications/export', [ApplicationMonitoringController::class, 'export'])->name('applications.export');
        Route::get('/applications', [ApplicationMonitoringController::class, 'index'])->name('applications.index');

        Route::get('/packages', [PackageManagementController::class, 'index'])->name('packages.index');
        Route::post('/packages', [PackageManagementController::class, 'store'])->name('packages.store');
        Route::put('/packages/{package}', [PackageManagementController::class, 'update'])->name('packages.update');
        Route::delete('/packages/{package}', [PackageManagementController::class, 'destroy'])->name('packages.destroy');

        Route::get('/payments/export', [PaymentManagementController::class, 'export'])->name('payments.export');
        Route::get('/payments', [PaymentManagementController::class, 'index'])->name('payments.index');
        Route::post('/payments', [PaymentManagementController::class, 'store'])->name('payments.store');
        Route::post('/payments/{payment}/approve', [PaymentManagementController::class, 'approve'])->name('payments.approve');
        Route::post('/payments/{payment}/refund', [PaymentManagementController::class, 'refund'])->name('payments.refund');
        Route::post('/payments/{payment}/retry', [PaymentManagementController::class, 'retry'])->name('payments.retry');

        Route::get('/verifications', [VerificationCenterController::class, 'index'])->name('verifications.index');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
        Route::get('/reports/{generatedReport}/download', [ReportController::class, 'download'])->name('reports.download');
        Route::delete('/reports/{generatedReport}', [ReportController::class, 'destroy'])->name('reports.destroy');

        Route::get('/content', [ContentManagementController::class, 'index'])->name('content.index');
        Route::post('/content', [ContentManagementController::class, 'store'])->name('content.store');
        Route::put('/content/{contentPage}', [ContentManagementController::class, 'update'])->name('content.update');
        Route::post('/content/{contentPage}/publish', [ContentManagementController::class, 'publish'])->name('content.publish');
        Route::delete('/content/{contentPage}', [ContentManagementController::class, 'destroy'])->name('content.destroy');

        Route::get('/notifications', [AdminNotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications', [AdminNotificationController::class, 'store'])->name('notifications.store');
        Route::post('/notifications/read-all', [AdminNotificationController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [AdminNotificationController::class, 'markRead'])->name('notifications.read');

        Route::get('/settings', [PlatformSettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [PlatformSettingController::class, 'update'])->name('settings.update');
        Route::post('/settings/reset', [PlatformSettingController::class, 'reset'])->name('settings.reset');

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
