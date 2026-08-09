<?php

use App\Http\Controllers\Auth\RegisterRoleController;
use App\Http\Controllers\Frontend\FrontendController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/', [FrontendController::class, 'index'])->name('home');

    Route::get('/register/{role}', RegisterRoleController::class)
        ->whereIn('role', ['job-seeker', 'employer'])
        ->name('register.role');
});
