<?php

use App\Enums\ContentPageStatus;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\ContentPage;
use App\Models\GeneratedReport;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Payment;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Storage;

test('the admin portal demo seeder adds two dummy records for each module', function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->where('email', 'admin@dev.com')->first();

    expect($admin)->not->toBeNull()
        ->and(User::query()->whereIn('email', [
            'gulf.tech@demo.test',
            'oasis.retail@demo.test',
        ])->count())->toBe(2)
        ->and(User::query()->where('role', UserRole::Employer)
            ->where('verification_status', EmployerVerificationStatus::Pending)
            ->count())->toBeGreaterThanOrEqual(2)
        ->and(User::query()->whereIn('email', [
            'fatima.hassan@demo.test',
            'omar.nasser@demo.test',
        ])->count())->toBe(2)
        ->and(JobPost::query()->whereIn('slug', [
            'senior-laravel-developer-demo',
            'retail-operations-manager-demo',
        ])->count())->toBe(2)
        ->and(JobPost::query()->where('slug', 'senior-laravel-developer-demo')->value('status'))->toBe(JobPostStatus::Active)
        ->and(JobApplication::query()->count())->toBeGreaterThanOrEqual(2)
        ->and(JobApplication::query()->where('status', JobApplicationStatus::Interview)->count())->toBeGreaterThanOrEqual(1)
        ->and(JobApplication::query()->whereNotNull('resume_path')->count())->toBeGreaterThanOrEqual(2)
        ->and(Storage::disk('local')->exists((string) JobApplication::query()->whereNotNull('resume_path')->value('resume_path')))->toBeTrue()
        ->and(Payment::query()->whereIn('reference', ['PAY-DEMO-001', 'PAY-DEMO-002'])->count())->toBe(2)
        ->and(Payment::query()->where('reference', 'PAY-DEMO-001')->value('status'))->toBe(PaymentStatus::Completed)
        ->and(ContentPage::query()->whereIn('slug', [
            'about-rr-job-portal-demo',
            'ramadan-hiring-campaign-demo',
        ])->count())->toBe(2)
        ->and(ContentPage::query()->where('slug', 'ramadan-hiring-campaign-demo')->value('status'))->toBe(ContentPageStatus::Draft)
        ->and(GeneratedReport::query()->whereIn('path', [
            'reports/demo-employers.csv',
            'reports/demo-jobs.csv',
        ])->count())->toBe(2)
        ->and(Storage::disk('local')->exists('reports/demo-employers.csv'))->toBeTrue()
        ->and($admin?->notifications()->count())->toBeGreaterThanOrEqual(2)
        ->and(ActivityLog::query()->count())->toBeGreaterThanOrEqual(2)
        ->and(Role::query()->whereIn('name', ['support-agent', 'content-editor'])->count())->toBe(2);
});

test('admins can see the demo records on portal module pages', function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->where('email', 'admin@dev.com')->first();

    $this->actingAs($admin)
        ->get(route('admin.employers.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/EmployerManagement')
            ->has('employers.data', 5));

    $this->actingAs($admin)
        ->get(route('admin.job-seekers.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/JobSeekerManagement')
            ->has('jobSeekers.data', 3));

    $this->actingAs($admin)
        ->get(route('admin.jobs.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/JobManagement')
            ->has('jobs.data', 2));

    $this->actingAs($admin)
        ->get(route('admin.applications.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/ApplicationsMonitoring')
            ->has('applications.data', 2));

    $this->actingAs($admin)
        ->get(route('admin.payments.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/PaymentsRevenue')
            ->has('payments.data', 2));

    $this->actingAs($admin)
        ->get(route('admin.verifications.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/VerificationCenter')
            ->has('pending', 2));

    $this->actingAs($admin)
        ->get(route('admin.content.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/ContentManagement')
            ->has('pages', 2));

    $this->actingAs($admin)
        ->get(route('admin.reports.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/ReportsAnalytics')
            ->has('reports', 2));

    $this->actingAs($admin)
        ->get(route('admin.notifications.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/AdminNotifications')
            ->has('notifications', 2));
});
