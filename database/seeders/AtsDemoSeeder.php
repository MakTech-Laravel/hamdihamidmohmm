<?php

namespace Database\Seeders;

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Enums\UserRole;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerCv;
use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Services\Ats\ApplicationScreeningService;
use App\Support\JobSeekerResume;
use App\Support\RoleAssigner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class AtsDemoSeeder extends Seeder
{
    public const SEEKER_EMAIL = 'ats.seeker@demo.test';

    public const JOB_SLUG = 'full-stack-laravel-react-developer-ats-demo';

    /**
     * Seed a job seeker with a default PDF CV, a matching job, an application, and a completed ATS score.
     */
    public function run(): void
    {
        $employer = User::query()->where('email', 'employer@dev.com')->first();

        if (! $employer instanceof User) {
            $this->call(UserSeeder::class);
            $employer = User::query()->where('email', 'employer@dev.com')->firstOrFail();
        }

        if ($employer->ats_enabled === false) {
            $employer->forceFill(['ats_enabled' => true])->save();
        }

        $job = JobPost::query()->updateOrCreate(
            ['slug' => self::JOB_SLUG],
            [
                'employer_id' => $employer->id,
                'title' => 'Full-Stack Laravel & React Developer',
                'category' => 'Technology',
                'location' => 'Dubai, UAE',
                'employment_type' => 'Full-time',
                'experience_level' => 'Mid Level',
                'salary_range' => 'SDG 15,000 - 22,000',
                'description' => '<p>Build and maintain our hiring platform: Laravel APIs, React front-end, and the background jobs behind them.</p>',
                'requirements' => '<ul><li>Bachelor\'s degree in Computer Science or a related field</li><li>3+ years of professional experience with Laravel and React</li><li>Comfortable with MySQL, REST APIs, and Docker</li></ul>',
                'skills' => ['Laravel', 'PHP', 'React', 'TypeScript', 'MySQL', 'Docker'],
                'status' => JobPostStatus::Active,
                'featured' => false,
                'expires_at' => now()->addDays(30),
            ],
        );

        $seeker = User::query()->updateOrCreate(
            ['email' => self::SEEKER_EMAIL],
            [
                'name' => 'Amira Khalid',
                'password' => 'password',
                'email_verified_at' => now(),
                'role' => UserRole::JobSeeker,
                'company_name' => null,
                'phone' => '+971 50 222 3344',
                'location' => 'Dubai, UAE',
                'account_status' => JobSeekerAccountStatus::Active,
                'resume_status' => JobSeekerResumeStatus::Active,
            ],
        );

        RoleAssigner::assign($seeker, UserRole::JobSeeker);

        JobSeekerProfile::query()->updateOrCreate(
            ['user_id' => $seeker->id],
            [
                'headline' => 'Full-Stack Developer (Laravel & React)',
                'bio' => 'Full-stack developer with 5 years of experience building Laravel APIs and React/TypeScript front-ends. Ships features end to end, from MySQL schema design to Docker-based deployments.',
                'skills' => ['Laravel', 'PHP', 'React', 'TypeScript', 'MySQL', 'Docker', 'REST APIs', 'Git'],
                'education' => [['degree' => 'Bachelor of Science in Computer Science', 'school' => 'University of Khartoum']],
                'experience' => [
                    ['title' => 'Senior Full-Stack Developer', 'company' => 'Nile Digital (2022 - Present)', 'years' => 3],
                    ['title' => 'Laravel Developer', 'company' => 'Sudan Tech Hub (2020 - 2022)', 'years' => 2],
                ],
                'languages' => ['English', 'Arabic'],
                'certifications' => ['AWS Certified Cloud Practitioner'],
            ],
        );

        $seeker->load('jobSeekerProfile');

        $filename = JobSeekerResume::filename($seeker);
        $path = 'resumes/'.$seeker->id.'/'.$filename;

        Storage::disk('local')->put($path, JobSeekerResume::pdf($seeker));

        $seeker->jobSeekerCvs()->where('file_path', '!=', $path)->update(['is_default' => false]);

        JobSeekerCv::query()->updateOrCreate(
            ['user_id' => $seeker->id, 'file_path' => $path],
            [
                'label' => 'Main CV',
                'original_name' => $filename,
                'is_default' => true,
            ],
        );

        $seeker->syncDefaultResumeFromCvs();

        $application = JobApplication::query()->updateOrCreate(
            [
                'job_post_id' => $job->id,
                'job_seeker_id' => $seeker->id,
            ],
            [
                'status' => JobApplicationStatus::Applied,
                'resume_path' => $path,
                'resume_original_name' => $filename,
                'cover_letter' => 'I am excited to apply for the Full-Stack Laravel & React Developer role. My background in Laravel APIs, React/TypeScript, MySQL, and Docker aligns with your requirements.',
            ],
        );

        app(ApplicationScreeningService::class)->screen($application, force: true);
    }
}
