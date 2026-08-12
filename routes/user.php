<?php

use App\Enums\RoleName;
use App\Http\Controllers\Backend\User\EmployerDashboardController;
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
        Route::get('/profile', JobSeekerProfileController::class)->name('profile');
        Route::get('/applications', JobSeekerApplicationsController::class)->name('applications');
        Route::get('/notifications', JobSeekerNotificationsController::class)->name('notifications');
        Route::get('/settings', JobSeekerSettingsController::class)->name('settings');
    });

    Route::get('/employer/dashboard', EmployerDashboardController::class)
        ->middleware('role:'.RoleName::Employer->value)
        ->name('employer.dashboard');

    Route::get('/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::post('/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
});
