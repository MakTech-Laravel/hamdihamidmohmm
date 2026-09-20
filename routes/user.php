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
use App\Http\Controllers\Backend\User\JobSeekerJobsController;
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
        Route::get('/jobs', JobSeekerJobsController::class)->name('jobs');
        Route::get('/profile', [JobSeekerProfileController::class, 'edit'])->name('profile');
        Route::put('/profile', [JobSeekerProfileController::class, 'update'])->name('profile.update');
        Route::post('/profile/photo', [JobSeekerProfileController::class, 'uploadPhoto'])->name('profile.photo.upload');
        Route::delete('/profile/photo', [JobSeekerProfileController::class, 'destroyPhoto'])->name('profile.photo.destroy');
        Route::post('/profile/resume', [JobSeekerProfileController::class, 'uploadResume'])->name('profile.resume.upload');
        Route::get('/profile/resume', [JobSeekerProfileController::class, 'downloadResume'])->name('profile.resume.download');
        Route::delete('/profile/resume', [JobSeekerProfileController::class, 'destroyResume'])->name('profile.resume.destroy');
        Route::post('/profile/cover-letter', [JobSeekerProfileController::class, 'uploadCoverLetter'])->name('profile.cover-letter.upload');
        Route::get('/profile/cover-letter', [JobSeekerProfileController::class, 'downloadCoverLetter'])->name('profile.cover-letter.download');
        Route::delete('/profile/cover-letter', [JobSeekerProfileController::class, 'destroyCoverLetter'])->name('profile.cover-letter.destroy');
        Route::post('/profile/highest-degree', [JobSeekerProfileController::class, 'uploadHighestDegree'])->name('profile.highest-degree.upload');
        Route::get('/profile/highest-degree', [JobSeekerProfileController::class, 'downloadHighestDegree'])->name('profile.highest-degree.download');
        Route::delete('/profile/highest-degree', [JobSeekerProfileController::class, 'destroyHighestDegree'])->name('profile.highest-degree.destroy');
        Route::post('/profile/other-document', [JobSeekerProfileController::class, 'uploadOtherDocument'])->name('profile.other-document.upload');
        Route::get('/profile/other-document', [JobSeekerProfileController::class, 'downloadOtherDocument'])->name('profile.other-document.download');
        Route::delete('/profile/other-document', [JobSeekerProfileController::class, 'destroyOtherDocument'])->name('profile.other-document.destroy');
        Route::post('/profile/certifications/file', [JobSeekerProfileController::class, 'uploadCertificationDocument'])->name('profile.certifications.upload');
        Route::get('/profile/certifications/{index}/file/{attachment?}', [JobSeekerProfileController::class, 'downloadCertificationDocument'])->name('profile.certifications.download');
        Route::delete('/profile/certifications/{index}/file', [JobSeekerProfileController::class, 'destroyCertificationDocument'])->name('profile.certifications.destroy');
        Route::get('/applications', [JobSeekerApplicationsController::class, 'index'])->name('applications');
        Route::post('/applications/{application}/withdraw', [JobSeekerApplicationsController::class, 'withdraw'])->name('applications.withdraw');
        Route::get('/notifications', [JobSeekerNotificationsController::class, 'index'])->name('notifications');
        Route::post('/notifications/read-all', [JobSeekerNotificationsController::class, 'markAllRead'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [JobSeekerNotificationsController::class, 'markRead'])->name('notifications.read');
        Route::get('/settings', [JobSeekerSettingsController::class, 'index'])->name('settings');
        Route::put('/settings', [JobSeekerSettingsController::class, 'updatePersonal'])->name('settings.update');
        Route::put('/settings/email-preferences', [JobSeekerSettingsController::class, 'updateEmailPreferences'])->name('settings.email-preferences');
        Route::delete('/settings/sessions', [JobSeekerSettingsController::class, 'destroyOtherSessions'])->name('settings.sessions.destroy');
    });

    Route::middleware('role:'.RoleName::JobSeeker->value)->post('/jobs/{jobPost}/apply', [JobSeekerApplicationsController::class, 'store'])->name('jobs.apply');

    Route::middleware(['role:'.RoleName::Employer->value, 'employer.approved'])->prefix('employer')->name('employer.')->group(function () {
        Route::get('/dashboard', EmployerDashboardController::class)->name('dashboard');
        Route::get('/profile', [EmployerProfileController::class, 'edit'])->name('profile');
        Route::put('/profile', [EmployerProfileController::class, 'update'])->name('profile.update');
        Route::put('/profile/public-about', [EmployerProfileController::class, 'updatePublicAbout'])->name('profile.public-about.update');
        Route::post('/profile/photo', [EmployerProfileController::class, 'uploadPhoto'])->name('profile.photo.upload');
        Route::delete('/profile/photo', [EmployerProfileController::class, 'destroyPhoto'])->name('profile.photo.destroy');
        Route::post('/profile/logo', [EmployerProfileController::class, 'uploadLogo'])->name('profile.logo.upload');
        Route::delete('/profile/logo', [EmployerProfileController::class, 'destroyLogo'])->name('profile.logo.destroy');
        Route::post('/profile/cover', [EmployerProfileController::class, 'uploadCover'])->name('profile.cover.upload');
        Route::delete('/profile/cover', [EmployerProfileController::class, 'destroyCover'])->name('profile.cover.destroy');
        Route::post('/profile/verification-document', [EmployerProfileController::class, 'uploadVerificationDocument'])->name('profile.verification-document.upload');
        Route::get('/profile/verification-document', [EmployerProfileController::class, 'downloadVerificationDocument'])->name('profile.verification-document.download');
        Route::delete('/profile/verification-document', [EmployerProfileController::class, 'destroyVerificationDocument'])->name('profile.verification-document.destroy');
        Route::get('/packages', [EmployerPackageController::class, 'index'])->name('packages');
        Route::post('/packages/{package}/select', [EmployerPackageController::class, 'select'])->name('packages.select');
        Route::get('/packages/checkout/success', [EmployerPackageController::class, 'checkoutSuccess'])->name('packages.checkout.success');
        Route::post('/packages/billing-portal', [EmployerPackageController::class, 'portal'])->name('packages.portal');
        Route::get('/jobs', [EmployerJobController::class, 'index'])->name('jobs');
        Route::get('/jobs/create', [EmployerJobController::class, 'create'])->name('jobs.create');
        Route::post('/jobs/description-attachments', [EmployerJobController::class, 'uploadDescriptionAttachment'])->name('jobs.description-attachments.store');
        Route::post('/jobs', [EmployerJobController::class, 'store'])->name('jobs.store');
        Route::get('/jobs/{job}/edit', [EmployerJobController::class, 'edit'])->name('jobs.edit');
        Route::put('/jobs/{job}', [EmployerJobController::class, 'update'])->name('jobs.update');
        Route::post('/jobs/{job}/logo', [EmployerJobController::class, 'uploadLogo'])->name('jobs.logo.upload');
        Route::delete('/jobs/{job}/logo', [EmployerJobController::class, 'destroyLogo'])->name('jobs.logo.destroy');
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
        Route::put('/settings/notifications', [EmployerPortalPageController::class, 'updateNotificationPreferences'])->name('settings.notifications');
        Route::put('/settings/privacy', [EmployerPortalPageController::class, 'updatePrivacyPreferences'])->name('settings.privacy');
        Route::post('/settings/deactivate', [EmployerPortalPageController::class, 'deactivate'])->name('settings.deactivate');
        Route::delete('/settings', [EmployerPortalPageController::class, 'destroy'])->name('settings.destroy');
    });

    Route::get('/profile', [UserProfileController::class, 'edit'])->name('user-profile.edit');
    Route::post('/profile', [UserProfileController::class, 'update'])->name('user-profile.update');
});
