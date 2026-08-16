<?php

use App\Enums\RoleName;
use App\Http\Controllers\Backend\User\EmployerApplicationController;
use App\Http\Controllers\Backend\User\EmployerDashboardController;
use App\Http\Controllers\Backend\User\EmployerJobController;
use App\Http\Controllers\Backend\User\EmployerPackageController;
use App\Http\Controllers\Backend\User\EmployerPortalPageController;
use App\Http\Controllers\Backend\User\EmployerProfileController;
use App\Http\Controllers\Backend\User\JobSeekerApplicationsController;
use App\Http\Controllers\Backend\User\JobSeekerDashboardController;
use App\Http\Controllers\Backend\User\JobSeekerNotificationsController;
use App\Http\Controllers\Backend\User\JobSeekerProfileController;
use App\Http\Controllers\Backend\User\JobSeekerSettingsController;
use App\Http\Controllers\Backend\User\UserDashboardController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');

    Route::middleware('role:'.RoleName::JobSeeker->value)->prefix('job-seeker')->name('job-seeker.')->group(function () {
        Route::get('/dashboard', JobSeekerDashboardController::class)->name('dashboard');
        Route::get('/profile', [JobSeekerProfileController::class, 'edit'])->name('profile');
        Route::put('/profile', [JobSeekerProfileController::class, 'update'])->name('profile.update');
        Route::get('/applications', [JobSeekerApplicationsController::class, 'index'])->name('applications');
        Route::post('/applications/{application}/withdraw', [JobSeekerApplicationsController::class, 'withdraw'])->name('applications.withdraw');
        Route::get('/notifications', [JobSeekerNotificationsController::class, 'index'])->name('notifications');
        Route::post('/notifications/read-all', [JobSeekerNotificationsController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [JobSeekerNotificationsController::class, 'markRead'])->name('notifications.read');
        Route::get('/settings', JobSeekerSettingsController::class)->name('settings');
    });

    Route::middleware('role:'.RoleName::JobSeeker->value)->post('/jobs/{jobPost}/apply', [JobSeekerApplicationsController::class, 'store'])->name('jobs.apply');

    Route::middleware('role:'.RoleName::Employer->value)->prefix('employer')->name('employer.')->group(function () {
        Route::get('/dashboard', EmployerDashboardController::class)->name('dashboard');
        Route::get('/profile', [EmployerProfileController::class, 'edit'])->name('profile');
        Route::put('/profile', [EmployerProfileController::class, 'update'])->name('profile.update');
        Route::get('/packages', EmployerPackageController::class)->name('packages');
        Route::get('/jobs', [EmployerJobController::class, 'index'])->name('jobs');
        Route::post('/jobs', [EmployerJobController::class, 'store'])->name('jobs.store');
        Route::put('/jobs/{job}', [EmployerJobController::class, 'update'])->name('jobs.update');
        Route::delete('/jobs/{job}', [EmployerJobController::class, 'destroy'])->name('jobs.destroy');
        Route::get('/applications', [EmployerApplicationController::class, 'index'])->name('applications');
        Route::put('/applications/{application}', [EmployerApplicationController::class, 'update'])->name('applications.update');
        Route::get('/notifications', [EmployerPortalPageController::class, 'notifications'])->name('notifications');
        Route::post('/notifications/read-all', [EmployerPortalPageController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [EmployerPortalPageController::class, 'markRead'])->name('notifications.read');
        Route::get('/settings', [EmployerPortalPageController::class, 'settings'])->name('settings');
    });

    Route::get('/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::post('/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
});
