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
        Route::post('/profile/resume', [JobSeekerProfileController::class, 'uploadResume'])->name('profile.resume.upload');
        Route::get('/profile/resume', [JobSeekerProfileController::class, 'downloadResume'])->name('profile.resume.download');
        Route::delete('/profile/resume', [JobSeekerProfileController::class, 'destroyResume'])->name('profile.resume.destroy');
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
        Route::get('/packages', [EmployerPackageController::class, 'index'])->name('packages');
        Route::post('/packages/{package}/select', [EmployerPackageController::class, 'select'])->name('packages.select');
        Route::get('/packages/checkout/success', [EmployerPackageController::class, 'checkoutSuccess'])->name('packages.checkout.success');
        Route::post('/packages/billing-portal', [EmployerPackageController::class, 'portal'])->name('packages.portal');
        Route::get('/jobs', [EmployerJobController::class, 'index'])->name('jobs');
        Route::get('/jobs/create', [EmployerJobController::class, 'create'])->name('jobs.create');
        Route::post('/jobs', [EmployerJobController::class, 'store'])->name('jobs.store');
        Route::get('/jobs/{job}/edit', [EmployerJobController::class, 'edit'])->name('jobs.edit');
        Route::put('/jobs/{job}', [EmployerJobController::class, 'update'])->name('jobs.update');
        Route::post('/jobs/{job}/duplicate', [EmployerJobController::class, 'duplicate'])->name('jobs.duplicate');
        Route::post('/jobs/{job}/pause', [EmployerJobController::class, 'pause'])->name('jobs.pause');
        Route::post('/jobs/{job}/publish', [EmployerJobController::class, 'publish'])->name('jobs.publish');
        Route::delete('/jobs/{job}', [EmployerJobController::class, 'destroy'])->name('jobs.destroy');
        Route::get('/applications', [EmployerApplicationController::class, 'index'])->name('applications');
        Route::get('/applications/{application}/resume', [EmployerApplicationController::class, 'downloadResume'])->name('applications.resume');
        Route::put('/applications/{application}', [EmployerApplicationController::class, 'update'])->name('applications.update');
        Route::get('/notifications', [EmployerPortalPageController::class, 'notifications'])->name('notifications');
        Route::post('/notifications/read-all', [EmployerPortalPageController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [EmployerPortalPageController::class, 'markRead'])->name('notifications.read');
        Route::delete('/notifications/{notification}', [EmployerPortalPageController::class, 'destroyNotification'])->name('notifications.destroy');
        Route::get('/settings', [EmployerPortalPageController::class, 'settings'])->name('settings');
        Route::put('/settings', [EmployerPortalPageController::class, 'updateSettings'])->name('settings.update');
    });

    Route::get('/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::post('/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
});
