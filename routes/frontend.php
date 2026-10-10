<?php

use App\Http\Controllers\Auth\RegisterRoleController;
use App\Http\Controllers\Frontend\ContactController;
use App\Http\Controllers\Frontend\FrontendController;
use App\Http\Controllers\Frontend\TrainingRegistrationController;
use App\Http\Controllers\LocaleController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FrontendController::class, 'jobs'])->name('jobs');
Route::redirect('/jobs', '/');
Route::get('/jobs/{jobPost:slug}', [FrontendController::class, 'jobShow'])->name('jobs.show');
Route::get('/discover', [FrontendController::class, 'index'])->name('discover');
Route::redirect('/home', '/discover');
Route::get('/pricing', [FrontendController::class, 'pricing'])->name('pricing');
Route::get('/training', [FrontendController::class, 'training'])->name('training');
Route::get('/training/videos/{video}', [FrontendController::class, 'trainingVideo'])->name('training.videos.show');
Route::get('/training/courses', [TrainingRegistrationController::class, 'index'])->name('training.courses.index');
Route::get('/training/courses/{trainingCourse:slug}', [TrainingRegistrationController::class, 'show'])->name('training.courses.show');
Route::get('/training/courses/{trainingCourse:slug}/register', [TrainingRegistrationController::class, 'create'])->name('training.courses.register');
Route::post('/training/courses/{trainingCourse:slug}/register', [TrainingRegistrationController::class, 'store'])->name('training.courses.register.store');
Route::get('/training/registrations/{trainingRegistration:public_token}', [TrainingRegistrationController::class, 'confirmation'])->name('training.registrations.confirmation');
Route::get('/about', [FrontendController::class, 'about'])->name('about');
Route::get('/contact', [FrontendController::class, 'contact'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

Route::post('/locale', LocaleController::class)->name('locale.update');

Route::middleware('guest')->group(function () {
    Route::get('/register/{role}', RegisterRoleController::class)
        ->whereIn('role', ['job-seeker', 'employer'])
        ->name('register.role');
});
