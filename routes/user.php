<?php

use App\Enums\UserRole;
use App\Http\Controllers\Backend\User\EmployerDashboardController;
use App\Http\Controllers\Backend\User\JobSeekerDashboardController;
use App\Http\Controllers\Backend\User\UserDashboardController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');

    Route::get('/job-seeker/dashboard', JobSeekerDashboardController::class)
        ->middleware('role:'.UserRole::JobSeeker->value)
        ->name('job-seeker.dashboard');

    Route::get('/employer/dashboard', EmployerDashboardController::class)
        ->middleware('role:'.UserRole::Employer->value)
        ->name('employer.dashboard');

    // Profile Routes
    Route::get('/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::post('/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
});
