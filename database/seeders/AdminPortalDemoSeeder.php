<?php

namespace Database\Seeders;

use App\Enums\ActivityAction;
use App\Enums\ContentPageStatus;
use App\Enums\ContentPageType;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Enums\PaymentStatus;
use App\Enums\PermissionName;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\ContentPage;
use App\Models\GeneratedReport;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\Package;
use App\Models\Payment;
use App\Models\Role;
use App\Models\User;
use App\Notifications\PortalNotification;
use App\Support\JobSeekerResume;
use App\Support\RoleAssigner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class AdminPortalDemoSeeder extends Seeder
{
    /**
     * Seed two dummy records for each admin portal module.
     */
    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@dev.com')->first();

        $activeEmployers = [
            $this->employer('gulf.tech@demo.test', [
                'name' => 'Sara Al-Maktoum',
                'company_name' => 'Gulf Tech Solutions',
                'contact_name' => 'Sara Al-Maktoum',
                'industry' => 'Technology',
                'website' => 'https://gulftech.example',
                'about' => 'Cloud and product engineering studio based in Dubai.',
                'address' => 'Business Bay, Dubai',
                'package' => EmployerPackage::Professional,
                'verification_status' => EmployerVerificationStatus::Approved,
                'account_status' => EmployerAccountStatus::Active,
                'verified_at' => now()->subDays(12),
            ]),
            $this->employer('oasis.retail@demo.test', [
                'name' => 'Hassan Al-Farsi',
                'company_name' => 'Oasis Retail Group',
                'contact_name' => 'Hassan Al-Farsi',
                'industry' => 'Retail',
                'website' => 'https://oasisretail.example',
                'about' => 'Regional retail brand hiring store and operations talent.',
                'address' => 'Al Reem Island, Abu Dhabi',
                'package' => EmployerPackage::Premium,
                'verification_status' => EmployerVerificationStatus::Approved,
                'account_status' => EmployerAccountStatus::Active,
                'verified_at' => now()->subDays(20),
            ]),
        ];

        $this->employer('aurora.pending@demo.test', [
            'name' => 'Layla Rahman',
            'company_name' => 'Aurora Media House',
            'contact_name' => 'Layla Rahman',
            'industry' => 'Media',
            'verification_status' => EmployerVerificationStatus::Pending,
            'account_status' => EmployerAccountStatus::PendingVerification,
            'package' => EmployerPackage::Starter,
            'verified_at' => null,
        ]);

        $this->employer('coastal.pending@demo.test', [
            'name' => 'Yusuf Ibrahim',
            'company_name' => 'Coastal Logistics LLC',
            'contact_name' => 'Yusuf Ibrahim',
            'industry' => 'Logistics',
            'verification_status' => EmployerVerificationStatus::Pending,
            'account_status' => EmployerAccountStatus::PendingVerification,
            'package' => EmployerPackage::Starter,
            'verified_at' => null,
        ]);

        $seekers = [
            $this->jobSeeker('fatima.hassan@demo.test', [
                'name' => 'Fatima Hassan',
                'phone' => '+971 50 111 2233',
                'location' => 'Dubai, UAE',
                'resume_status' => JobSeekerResumeStatus::Active,
                'account_status' => JobSeekerAccountStatus::Active,
                'headline' => 'Senior Laravel Developer',
                'bio' => 'Full-stack engineer with 6 years of Laravel and React experience.',
                'skills' => ['PHP', 'Laravel', 'React', 'MySQL'],
            ]),
            $this->jobSeeker('omar.nasser@demo.test', [
                'name' => 'Omar Nasser',
                'phone' => '+971 55 444 7788',
                'location' => 'Sharjah, UAE',
                'resume_status' => JobSeekerResumeStatus::Warning,
                'account_status' => JobSeekerAccountStatus::Suspended,
                'headline' => 'Civil Site Engineer',
                'bio' => 'Site engineer focused on residential and commercial construction.',
                'skills' => ['AutoCAD', 'Site Supervision', 'HSE'],
            ]),
        ];

        $jobs = [
            $this->jobPost($activeEmployers[0], [
                'title' => 'Senior Laravel Developer',
                'slug' => 'senior-laravel-developer-demo',
                'category' => 'Technology',
                'location' => 'Dubai, UAE',
                'employment_type' => 'Full-time',
                'salary_range' => 'SGD 18,000 - 25,000',
                'description' => 'Build and maintain the RR Job Portal backend, APIs, and admin tooling.',
                'status' => JobPostStatus::Active,
                'featured' => false,
                'views' => 128,
                'expires_at' => now()->addDays(30),
            ]),
            $this->jobPost($activeEmployers[1], [
                'title' => 'Retail Operations Manager',
                'slug' => 'retail-operations-manager-demo',
                'category' => 'Retail',
                'location' => 'Abu Dhabi, UAE',
                'employment_type' => 'Full-time',
                'salary_range' => 'SGD 12,000 - 16,000',
                'description' => 'Lead store operations, staffing, and customer experience across two locations.',
                'status' => JobPostStatus::Pending,
                'featured' => false,
                'views' => 22,
                'expires_at' => now()->addDays(21),
            ]),
        ];

        $this->application($jobs[0], $seekers[0], JobApplicationStatus::Applied, 'I would love to join Gulf Tech as a Laravel developer.');
        $this->application($jobs[0], $seekers[1], JobApplicationStatus::Interview, 'I am available for an interview next week.');

        $professional = Package::query()->where('slug', EmployerPackage::Professional->value)->first();
        $premium = Package::query()->where('slug', EmployerPackage::Premium->value)->first();

        $this->payment($activeEmployers[0], $professional, [
            'amount' => 299,
            'method' => 'card',
            'status' => PaymentStatus::Completed,
            'reference' => 'PAY-DEMO-001',
            'paid_at' => now()->subDays(3),
        ]);
        $this->payment($activeEmployers[1], $premium, [
            'amount' => 999,
            'method' => 'bank_transfer',
            'status' => PaymentStatus::Pending,
            'reference' => 'PAY-DEMO-002',
            'paid_at' => null,
        ]);

        $this->contentPage([
            'title' => 'About RR Job Portal',
            'slug' => 'about-rr-job-portal-demo',
            'type' => ContentPageType::Page,
            'body' => 'RR Job Portal connects employers and job seekers across the UAE.',
            'status' => ContentPageStatus::Published,
        ]);
        $this->contentPage([
            'title' => 'Ramadan hiring campaign',
            'slug' => 'ramadan-hiring-campaign-demo',
            'type' => ContentPageType::Announcement,
            'body' => 'Job listings are discounted 20% during the Ramadan hiring campaign.',
            'status' => ContentPageStatus::Draft,
        ]);

        if ($admin instanceof User) {
            $this->report($admin, [
                'name' => 'Employers export',
                'module' => 'employers',
                'path' => 'reports/demo-employers.csv',
            ]);
            $this->report($admin, [
                'name' => 'Jobs export',
                'module' => 'jobs',
                'path' => 'reports/demo-jobs.csv',
            ]);

            $this->notify($admin, 'New employer pending verification', 'Aurora Media House submitted documents for review.', 'Verification');
            $this->notify($admin, 'Payment completed', 'Gulf Tech Solutions paid for the Professional package.', 'Payments');

            $this->activity($seekers[0], ActivityAction::LoggedIn, 'Signed in to the portal.', $seekers[0]);
            $this->activity($activeEmployers[0], ActivityAction::EmployerApproved, 'Employer approved.', $admin);
        }

        $this->customRole('support-agent', 'Support Agent', 'Handles employer and job seeker support tickets.', [
            PermissionName::AccessAdminPanel->value,
            PermissionName::ManageUsers->value,
            PermissionName::ManageEmployers->value,
            PermissionName::ManageJobSeekers->value,
        ]);
        $this->customRole('content-editor', 'Content Editor', 'Updates public website pages and announcements.', [
            PermissionName::AccessAdminPanel->value,
            PermissionName::ManageCms->value,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function employer(string $email, array $attributes): User
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            array_merge([
                'password' => 'password',
                'email_verified_at' => now(),
                'role' => UserRole::Employer,
            ], $attributes),
        );

        RoleAssigner::assign($user, UserRole::Employer);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function jobSeeker(string $email, array $attributes): User
    {
        $headline = $attributes['headline'] ?? null;
        $bio = $attributes['bio'] ?? null;
        $skills = $attributes['skills'] ?? ['Communication'];
        unset($attributes['headline'], $attributes['bio'], $attributes['skills']);

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            array_merge([
                'password' => 'password',
                'email_verified_at' => now(),
                'role' => UserRole::JobSeeker,
                'company_name' => null,
            ], $attributes),
        );

        RoleAssigner::assign($user, UserRole::JobSeeker);

        JobSeekerProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'headline' => $headline,
                'bio' => $bio,
                'skills' => $skills,
                'education' => [['school' => 'UAE University', 'degree' => 'BSc']],
                'experience' => [['company' => 'Demo Company', 'title' => $headline]],
                'languages' => ['English', 'Arabic'],
                'certifications' => [],
            ],
        );

        return $user;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function jobPost(User $employer, array $attributes): JobPost
    {
        return JobPost::query()->updateOrCreate(
            ['slug' => $attributes['slug']],
            array_merge($attributes, [
                'employer_id' => $employer->id,
            ]),
        );
    }

    private function application(JobPost $job, User $seeker, JobApplicationStatus $status, string $coverLetter): JobApplication
    {
        $seeker->loadMissing('jobSeekerProfile');
        $filename = JobSeekerResume::filename($seeker);
        $path = 'resumes/'.$seeker->id.'/'.$filename;

        Storage::disk('local')->put($path, JobSeekerResume::pdf($seeker));

        return JobApplication::query()->updateOrCreate(
            [
                'job_post_id' => $job->id,
                'job_seeker_id' => $seeker->id,
            ],
            [
                'status' => $status,
                'cover_letter' => $coverLetter,
                'resume_path' => $path,
                'resume_original_name' => $filename,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function payment(User $employer, ?Package $package, array $attributes): Payment
    {
        return Payment::query()->updateOrCreate(
            ['reference' => $attributes['reference']],
            array_merge($attributes, [
                'employer_id' => $employer->id,
                'package_id' => $package?->id,
                'currency' => 'SGD',
            ]),
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function contentPage(array $attributes): ContentPage
    {
        return ContentPage::query()->updateOrCreate(
            ['slug' => $attributes['slug']],
            $attributes,
        );
    }

    /**
     * @param  array{name: string, module: string, path: string}  $attributes
     */
    private function report(User $admin, array $attributes): GeneratedReport
    {
        Storage::disk('local')->put($attributes['path'], "module,count\n{$attributes['module']},2\n");

        return GeneratedReport::query()->updateOrCreate(
            ['path' => $attributes['path']],
            [
                'name' => $attributes['name'],
                'module' => $attributes['module'],
                'format' => 'csv',
                'generated_by' => $admin->id,
                'generated_at' => now()->subDay(),
            ],
        );
    }

    private function notify(User $admin, string $title, string $message, string $category): void
    {
        $alreadySent = $admin->notifications()
            ->where('type', PortalNotification::class)
            ->get()
            ->contains(fn ($notification): bool => ($notification->data['title'] ?? '') === $title);

        if ($alreadySent) {
            return;
        }

        $admin->notify(new PortalNotification($title, $message, $category));
    }

    private function activity(User $subject, ActivityAction $action, string $description, ?User $actor = null): void
    {
        ActivityLog::query()->firstOrCreate(
            [
                'user_id' => $subject->id,
                'action' => $action,
                'description' => $description,
            ],
            [
                'actor_id' => $actor?->id,
                'ip_address' => '127.0.0.1',
            ],
        );
    }

    /**
     * @param  list<string>  $permissions
     */
    private function customRole(string $name, string $label, string $description, array $permissions): Role
    {
        $role = Role::query()->updateOrCreate(
            ['name' => $name, 'guard_name' => 'web'],
            [
                'label' => $label,
                'description' => $description,
                'is_system' => false,
                'is_locked' => false,
            ],
        );

        $role->syncPermissions($permissions);

        return $role;
    }
}
