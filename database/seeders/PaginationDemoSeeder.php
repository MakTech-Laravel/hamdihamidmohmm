<?php

namespace Database\Seeders;

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\UserRole;
use App\Models\AiChatLog;
use App\Models\ContactMessage;
use App\Models\ContentPage;
use App\Models\EmployerRosterEntry;
use App\Models\GeneratedReport;
use App\Models\JobAlert;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\JobTaxonomy;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use App\Models\User;
use App\Support\PortalNotifier;
use App\Support\RoleAssigner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PaginationDemoSeeder extends Seeder
{
    private const COUNT = 60;

    public function run(): void
    {
        $this->command?->info('Seeding ~'.self::COUNT.' rows per major list for pagination demos...');

        $employer = $this->demoEmployer();
        $seeker = $this->demoSeeker();
        $admin = User::query()->where('email', 'admin@dev.com')->first()
            ?? User::factory()->admin()->create(['email' => 'admin@dev.com']);

        $jobs = $this->seedEmployerJobs($employer);
        $this->seedEmployerApplications($employer, $jobs);
        $this->seedEmployerRoster($employer, $jobs);
        $this->seedEmployerPayments($employer);
        $this->seedEmployerNotifications($employer);
        $this->seedJobSeekerApplications($seeker);
        $this->seedJobSeekerAlerts($seeker);
        $this->seedJobSeekerNotifications($seeker);
        $this->seedAdminLists($admin);
        $this->seedPublicJobs();

        $this->command?->info('Done. Log in as:');
        $this->command?->line('  employer@dev.com / employer@dev.com');
        $this->command?->line('  seeker@dev.com / seeker@dev.com');
        $this->command?->line('  admin@dev.com / admin@dev.com');
    }

    private function demoEmployer(): User
    {
        $employer = User::query()->updateOrCreate(
            ['email' => 'employer@dev.com'],
            [
                'name' => 'Horizon Hiring Ltd',
                'company_name' => 'Horizon Hiring Ltd',
                'password' => Hash::make('employer@dev.com'),
                'email_verified_at' => now(),
                'role' => UserRole::Employer,
                'verification_status' => EmployerVerificationStatus::Approved,
                'account_status' => EmployerAccountStatus::Active,
                'verified_at' => now(),
                'package' => EmployerPackage::Professional,
            ],
        );

        RoleAssigner::assign($employer, UserRole::Employer);

        return $employer;
    }

    private function demoSeeker(): User
    {
        $seeker = User::query()->updateOrCreate(
            ['email' => 'seeker@dev.com'],
            [
                'name' => 'Job Seeker',
                'password' => Hash::make('seeker@dev.com'),
                'email_verified_at' => now(),
                'role' => UserRole::JobSeeker,
                'account_status' => JobSeekerAccountStatus::Active,
            ],
        );

        RoleAssigner::assign($seeker, UserRole::JobSeeker);

        if (! $seeker->jobSeekerProfile()->exists()) {
            JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);
        }

        return $seeker;
    }

    /**
     * @return list<JobPost>
     */
    private function seedEmployerJobs(User $employer): array
    {
        $needed = max(0, self::COUNT - JobPost::query()->where('employer_id', $employer->id)->count());

        if ($needed === 0) {
            return JobPost::query()->where('employer_id', $employer->id)->latest('id')->limit(self::COUNT)->get()->all();
        }

        $statuses = [
            JobPostStatus::Active,
            JobPostStatus::Active,
            JobPostStatus::Active,
            JobPostStatus::Draft,
            JobPostStatus::Pending,
            JobPostStatus::Expired,
        ];

        $created = [];

        for ($i = 1; $i <= $needed; $i++) {
            $status = $statuses[($i - 1) % count($statuses)];
            $title = "Pagination Demo Job {$i}";

            $created[] = JobPost::factory()->create([
                'employer_id' => $employer->id,
                'title' => $title,
                'slug' => Str::slug($title).'-'.Str::lower(Str::random(5)),
                'status' => $status,
                'expires_at' => $status === JobPostStatus::Expired
                    ? now()->subDays(3)
                    : now()->addDays(30),
            ]);
        }

        $this->command?->info("Employer jobs: +{$needed}");

        return JobPost::query()->where('employer_id', $employer->id)->latest('id')->limit(self::COUNT)->get()->all();
    }

    /**
     * @param  list<JobPost>  $jobs
     */
    private function seedEmployerApplications(User $employer, array $jobs): void
    {
        if ($jobs === []) {
            return;
        }

        $existing = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $employer->id))
            ->count();

        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Employer applications: already enough');

            return;
        }

        $statuses = JobApplicationStatus::cases();

        for ($i = 1; $i <= $needed; $i++) {
            $seeker = User::factory()->jobSeeker()->create([
                'name' => "Applicant Demo {$i}",
                'email' => "applicant.demo.{$i}.".Str::lower(Str::random(4)).'@example.com',
            ]);
            JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

            JobApplication::factory()->create([
                'job_post_id' => $jobs[($i - 1) % count($jobs)]->id,
                'job_seeker_id' => $seeker->id,
                'status' => $statuses[($i - 1) % count($statuses)],
                'cover_letter' => "Pagination demo application #{$i}",
            ]);
        }

        $this->command?->info("Employer applications: +{$needed}");
    }

    /**
     * @param  list<JobPost>  $jobs
     */
    private function seedEmployerRoster(User $employer, array $jobs): void
    {
        $accountId = $employer->employerAccountId();
        $existing = EmployerRosterEntry::query()->forAccount($accountId)->count();
        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Employer roster: already enough');

            return;
        }

        $job = $jobs[0] ?? JobPost::factory()->create(['employer_id' => $employer->id]);

        for ($i = 1; $i <= $needed; $i++) {
            $seeker = User::factory()->jobSeeker()->create([
                'name' => "Roster Candidate {$i}",
                'email' => "roster.demo.{$i}.".Str::lower(Str::random(4)).'@example.com',
            ]);
            JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

            $application = JobApplication::factory()->create([
                'job_post_id' => $job->id,
                'job_seeker_id' => $seeker->id,
                'status' => JobApplicationStatus::Shortlisted,
            ]);

            EmployerRosterEntry::factory()->create([
                'employer_owner_id' => $accountId,
                'job_seeker_id' => $seeker->id,
                'job_application_id' => $application->id,
                'added_by' => $employer->id,
                'category' => fake()->randomElement(['Talent pool', 'Referral', 'Future hire', 'Hold']),
            ]);
        }

        $this->command?->info("Employer roster: +{$needed}");
    }

    private function seedEmployerPayments(User $employer): void
    {
        $package = Package::query()->orderBy('id')->first() ?? Package::factory()->create();
        $existing = Payment::query()->where('employer_id', $employer->id)->count();
        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Employer invoices: already enough');

            return;
        }

        Payment::factory()
            ->count($needed)
            ->create([
                'employer_id' => $employer->id,
                'package_id' => $package->id,
            ]);

        $this->command?->info("Employer invoices: +{$needed}");
    }

    private function seedEmployerNotifications(User $employer): void
    {
        $existing = $employer->notifications()->count();
        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Employer notifications: already enough');

            return;
        }

        for ($i = 1; $i <= $needed; $i++) {
            PortalNotifier::send(
                $employer,
                "Employer notice {$i}",
                "Pagination demo employer notification #{$i}",
                fake()->randomElement(['Application', 'Job', 'Billing', 'System']),
            );
        }

        $this->command?->info("Employer notifications: +{$needed}");
    }

    private function seedJobSeekerApplications(User $seeker): void
    {
        $existing = JobApplication::query()->where('job_seeker_id', $seeker->id)->count();
        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Job seeker applications: already enough');

            return;
        }

        $statuses = JobApplicationStatus::cases();

        for ($i = 1; $i <= $needed; $i++) {
            $job = JobPost::factory()->create([
                'title' => "Seeker Applied Role {$i}",
                'status' => JobPostStatus::Active,
            ]);

            JobApplication::factory()->create([
                'job_post_id' => $job->id,
                'job_seeker_id' => $seeker->id,
                'status' => $statuses[($i - 1) % count($statuses)],
            ]);
        }

        $this->command?->info("Job seeker applications: +{$needed}");
    }

    private function seedJobSeekerAlerts(User $seeker): void
    {
        $existing = JobAlert::query()->where('user_id', $seeker->id)->count();
        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Job seeker alerts: already enough');

            return;
        }

        for ($i = 1; $i <= $needed; $i++) {
            JobAlert::factory()->create([
                'user_id' => $seeker->id,
                'name' => "Alert Demo {$i}",
                'keyword' => "Keyword {$i}",
            ]);
        }

        $this->command?->info("Job seeker alerts: +{$needed}");
    }

    private function seedJobSeekerNotifications(User $seeker): void
    {
        $existing = $seeker->notifications()->count();
        $needed = max(0, self::COUNT - $existing);

        if ($needed === 0) {
            $this->command?->info('Job seeker notifications: already enough');

            return;
        }

        for ($i = 1; $i <= $needed; $i++) {
            PortalNotifier::send(
                $seeker,
                "Seeker notice {$i}",
                "Pagination demo seeker notification #{$i}",
                fake()->randomElement(['Application', 'Job', 'System']),
            );
        }

        $this->command?->info("Job seeker notifications: +{$needed}");
    }

    private function seedAdminLists(User $admin): void
    {
        $this->fillTo(User::query()->role(UserRole::Employer->value), self::COUNT, function () {
            return User::factory()->employer()->create([
                'email' => 'employer.demo.'.Str::lower(Str::random(8)).'@example.com',
                'verification_status' => EmployerVerificationStatus::Approved,
                'account_status' => EmployerAccountStatus::Active,
            ]);
        }, 'Admin employers');

        $this->fillTo(User::query()->role(UserRole::JobSeeker->value), self::COUNT, function () {
            $user = User::factory()->jobSeeker()->create([
                'email' => 'seeker.demo.'.Str::lower(Str::random(8)).'@example.com',
            ]);
            JobSeekerProfile::factory()->create(['user_id' => $user->id]);

            return $user;
        }, 'Admin job seekers');

        $pendingNeeded = max(0, self::COUNT - User::query()
            ->role(UserRole::Employer->value)
            ->where('verification_status', EmployerVerificationStatus::Pending)
            ->count());

        if ($pendingNeeded > 0) {
            for ($i = 1; $i <= $pendingNeeded; $i++) {
                User::factory()->employer()->create([
                    'email' => 'pending.employer.'.$i.'.'.Str::lower(Str::random(4)).'@example.com',
                    'verification_status' => EmployerVerificationStatus::Pending,
                    'account_status' => EmployerAccountStatus::PendingVerification,
                    'company_name' => "Pending Co {$i}",
                ]);
            }
            $this->command?->info("Admin verification pending: +{$pendingNeeded}");
        }

        $this->fillTo(JobPost::query(), self::COUNT, fn () => JobPost::factory()->create([
            'title' => 'Admin Visible Job '.Str::upper(Str::random(5)),
            'status' => JobPostStatus::Active,
        ]), 'Admin jobs');

        $this->fillTo(JobApplication::query(), self::COUNT, function () {
            $seeker = User::factory()->jobSeeker()->create([
                'email' => 'app.monitor.'.Str::lower(Str::random(8)).'@example.com',
            ]);
            JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

            return JobApplication::factory()->create([
                'job_seeker_id' => $seeker->id,
                'job_post_id' => JobPost::factory()->create(['status' => JobPostStatus::Active])->id,
            ]);
        }, 'Admin applications monitor');

        $this->fillTo(Payment::query(), self::COUNT, fn () => Payment::factory()->create(), 'Admin payments');

        $this->fillTo(ContactMessage::query(), self::COUNT, fn () => ContactMessage::factory()->create(), 'Admin contact messages');

        $this->fillTo(ContentPage::query(), self::COUNT, fn () => ContentPage::factory()->create([
            'title' => 'CMS Page '.Str::upper(Str::random(5)),
            'slug' => 'cms-'.Str::lower(Str::random(8)),
        ]), 'Admin content pages');

        $this->fillTo(JobTaxonomy::query(), self::COUNT, function () {
            $name = 'Taxonomy '.Str::upper(Str::random(6));

            return JobTaxonomy::factory()->create([
                'name' => $name,
                'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            ]);
        }, 'Admin taxonomies');

        $this->fillTo(TrainingCourse::query(), self::COUNT, fn () => TrainingCourse::factory()->create([
            'title' => 'Training Course '.Str::upper(Str::random(5)),
        ]), 'Admin training courses');

        $course = TrainingCourse::query()->latest('id')->first() ?? TrainingCourse::factory()->create();

        $this->fillTo(TrainingRegistration::query(), self::COUNT, fn () => TrainingRegistration::factory()->create([
            'training_course_id' => $course->id,
            'registration_number' => 'TR-'.now()->format('Y').'-'.fake()->unique()->numerify('#####'),
        ]), 'Admin training registrations');

        $this->fillTo(GeneratedReport::query(), self::COUNT, fn () => GeneratedReport::factory()->create([
            'generated_by' => $admin->id,
            'name' => 'Report '.Str::upper(Str::random(5)),
            'path' => 'reports/demo-'.Str::lower(Str::random(8)).'.csv',
        ]), 'Admin reports');

        $this->fillTo(AiChatLog::query(), self::COUNT, fn () => AiChatLog::factory()->admin()->create(), 'Admin AI logs');

        $adminNotifyNeeded = max(0, self::COUNT - $admin->notifications()->count());

        if ($adminNotifyNeeded > 0) {
            for ($i = 1; $i <= $adminNotifyNeeded; $i++) {
                PortalNotifier::send(
                    $admin,
                    "Admin notice {$i}",
                    "Pagination demo admin notification #{$i}",
                    'System',
                );
            }
            $this->command?->info("Admin notifications: +{$adminNotifyNeeded}");
        }
    }

    private function seedPublicJobs(): void
    {
        $active = JobPost::query()->active()->count();
        $needed = max(0, self::COUNT - $active);

        if ($needed === 0) {
            $this->command?->info('Public/job-seeker browse jobs: already enough');

            return;
        }

        JobPost::factory()->count($needed)->create([
            'status' => JobPostStatus::Active,
            'expires_at' => now()->addDays(20),
        ]);

        $this->command?->info("Public active jobs: +{$needed}");
    }

    /**
     * @param  Builder<Model>  $query
     * @param  callable(): mixed  $factory
     */
    private function fillTo(Builder $query, int $target, callable $factory, string $label): void
    {
        $needed = max(0, $target - (clone $query)->count());

        if ($needed === 0) {
            $this->command?->info("{$label}: already enough");

            return;
        }

        for ($i = 0; $i < $needed; $i++) {
            $factory();
        }

        $this->command?->info("{$label}: +{$needed}");
    }
}
