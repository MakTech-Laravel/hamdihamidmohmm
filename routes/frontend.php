<?php

use App\Http\Controllers\Auth\RegisterRoleController;
use App\Http\Controllers\Frontend\ContactController;
use App\Http\Controllers\Frontend\FrontendController;
use App\Http\Controllers\LocaleController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FrontendController::class, 'index'])->name('home');
Route::get('/jobs', [FrontendController::class, 'jobs'])->name('jobs');
Route::get('/jobs/{slug}', [FrontendController::class, 'jobShow'])->name('jobs.show');
Route::get('/pricing', [FrontendController::class, 'pricing'])->name('pricing');
Route::get('/about', [FrontendController::class, 'about'])->name('about');
Route::get('/contact', [FrontendController::class, 'contact'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

Route::post('/locale', LocaleController::class)->name('locale.update');

Route::middleware('guest')->group(function () {
    Route::get('/register/{role}', RegisterRoleController::class)
        ->whereIn('role', ['job-seeker', 'employer'])
        ->name('register.role');
});
