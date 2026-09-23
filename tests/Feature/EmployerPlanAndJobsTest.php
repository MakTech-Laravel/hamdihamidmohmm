<?php

use App\Enums\EmployerPackage;
use App\Enums\JobPostStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
});

test('employer dashboard includes the live plan snapshot', function () {
    $employer = User::factory()->employer()->create();
    Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'job_credits' => 1,
        'featured_credits' => 0,
        'is_public' => true,
        'is_active' => true,
    ]);
    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerDashboard')
            ->where('plan.slug', EmployerPackage::Professional->value)
            ->where('plan.jobs_posted', 1)
            ->where('plan.credits_remaining', 0)
            ->has('stats'));
});

test('employers can open the post job wizard and edit an existing job', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'Horizon Hiring Ltd',
    ]);
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Backend Engineer',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.jobs.create'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerJobEditor')
            ->where('job', null)
            ->where('company.name', 'Horizon Hiring Ltd')
            ->has('company.logo_url')
            ->has('options.positionAreas')
            ->where('options.positionAreas', fn($areas) => collect($areas)->contains(
                fn($item) => ($item['value'] ?? null) === 'others' || ($item['label'] ?? null) === 'Others'
            ))
            ->has('options.employmentTypes')
            ->has('options.countries')
            ->has('options.dutyStations'));

    $this->actingAs($employer)
        ->get(route('employer.jobs.edit', $job))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerJobEditor')
            ->where('job.title', 'Backend Engineer')
            ->where('job.id', $job->id)
            ->where('job.slug', $job->slug)
            ->where('company.name', 'Horizon Hiring Ltd'));
});

test('employers cannot save a job with a free-text category', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Hospital Administrator',
            'subtitle' => 'Lead patient operations across clinics',
            'category' => 'Hospitality Management',
            'location' => 'Khartoum',
            'employment_type' => 'Full-time',
            'experience_level' => 'Mid Level',
            'publish' => false,
        ])
        ->assertSessionHasErrors(['category', 'location', 'employment_type']);
});

test('employers cannot save a job without location category or job type', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->from(route('employer.jobs.create'))
        ->post(route('employer.jobs.store'), [
            'title' => 'Hospital Administrator',
            'category' => '',
            'location' => '',
            'employment_type' => '',
            'experience_level' => '',
            'publish' => false,
        ])
        ->assertRedirect(route('employer.jobs.create'))
        ->assertSessionHasErrors([
            'category',
            'location',
            'employment_type',
            'experience_level',
        ]);

    expect(JobPost::query()->count())->toBe(0);
});

test('employers can save a job with taxonomy selects', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Hospital Administrator',
            'subtitle' => 'Lead patient operations across clinics',
            'category' => 'healthcare',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'Mid Level',
            'publish' => false,
        ])
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->category)->toBe('healthcare')
        ->and($job->location)->toBe('khartoum')
        ->and($job->country)->toBe('sudan')
        ->and($job->subtitle)->toBe('Lead patient operations across clinics')
        ->and($job->status)->toBe(JobPostStatus::Draft);
});

test('employers can save a draft and later submit it for review', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Product Designer',
            'category' => 'design',
            'location' => 'remote',
            'country' => 'remote',
            'employment_type' => 'full_time',
            'experience_level' => 'Senior',
            'salary_range' => 'SAR 18,000–25,000',
            'description' => '<p><strong>Design</strong> the portal. <span style="font-size: 18px">Impact role.</span></p><script>alert(1)</script>',
            'requirements' => 'Figma and research.',
            'skills' => 'Figma, UX',
            'publish' => false,
        ])
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->status)->toBe(JobPostStatus::Draft)
        ->and($job->category)->toBe('design')
        ->and($job->skills)->toBe(['Figma', 'UX'])
        ->and($job->description)->toContain('<strong>Design</strong>')
        ->and($job->description)->toContain('font-size: 18px')
        ->and($job->description)->not->toContain('<script>');

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), [
            'title' => 'Senior Product Designer',
            'category' => 'design',
            'location' => 'remote',
            'country' => 'remote',
            'employment_type' => 'full_time',
            'experience_level' => 'Senior',
            'description' => 'Design the portal.',
            'publish' => true,
        ])
        ->assertRedirect(route('employer.jobs'));

    expect($job->fresh()->status)->toBe(JobPostStatus::Pending)
        ->and($job->fresh()->title)->toBe('Senior Product Designer');
});

test('publishing is blocked when the current public plan has no remaining credits', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'job_credits' => 1,
        'featured_credits' => 0,
        'is_public' => true,
        'is_active' => true,
    ]);
    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Pending,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Second Role',
            'category' => 'technology',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'Mid Level',
            'publish' => true,
        ])
        ->assertSessionHasErrors('title');

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Draft Role',
            'category' => 'technology',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'Mid Level',
            'publish' => false,
        ])
        ->assertRedirect(route('employer.jobs'));

    expect(JobPost::query()->where('status', JobPostStatus::Draft)->count())->toBe(1);
});

test('employers can view the designed my jobs table with live stats', function () {
    $employer = User::factory()->employer()->create();
    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior Frontend Developer',
        'status' => JobPostStatus::Active,
        'category' => 'Technology',
        'location' => 'Riyadh',
    ]);
    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Draft Role',
        'status' => JobPostStatus::Draft,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerJobs')
            ->where('stats.total', 2)
            ->where('stats.active', 1)
            ->where('stats.draft', 1)
            ->has('jobs', 2));
});

test('employers can duplicate pause and republish jobs they own', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
        'title' => 'Frontend Developer',
    ]);

    $this->actingAs($employer)
        ->post(route('employer.jobs.duplicate', $job))
        ->assertRedirect();

    $copy = JobPost::query()->where('title', 'Frontend Developer (Copy)')->first();

    expect($copy)->not->toBeNull()
        ->and($copy->status)->toBe(JobPostStatus::Draft)
        ->and($copy->employer_id)->toBe($employer->id);

    $this->actingAs($employer)
        ->post(route('employer.jobs.pause', $job))
        ->assertRedirect();

    expect($job->fresh()->status)->toBe(JobPostStatus::Draft);

    $this->actingAs($employer)
        ->post(route('employer.jobs.publish', $job))
        ->assertRedirect();

    expect($job->fresh()->status)->toBe(JobPostStatus::Pending);
});

test('employers can select a public plan via manual payment approval', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $business = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 999,
        'currency' => 'SDG',
        'job_credits' => 15,
        'featured_credits' => 2,
        'is_public' => true,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $payment = Payment::query()->create([
        'employer_id' => $employer->id,
        'package_id' => $business->id,
        'amount' => $business->price,
        'currency' => 'SDG',
        'method' => 'bank_transfer',
        'status' => PaymentStatus::Pending,
        'reference' => 'BANK-TEST1234',
    ]);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.payments.approve', $payment))
        ->assertRedirect();

    expect($employer->fresh()->package)->toBe(EmployerPackage::Premium)
        ->and($employer->fresh()->subscription_status)->toBe(SubscriptionStatus::Active);

    $this->actingAs($employer)
        ->get(route('employer.packages'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerPackages')
            ->where('plan.slug', EmployerPackage::Premium->value)
            ->where('plan.job_credits', 15)
            ->has('packages')
            ->has('invoices'));

    expect(Payment::query()->where('employer_id', $employer->id)->latest('id')->first())
        ->status->toBe(PaymentStatus::Completed)
        ->package_id->toBe($business->id);
});

test('employers can update company profile sections used by the dashboard', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->put(route('employer.profile.update'), [
            'company_name' => 'TechCorp Solutions',
            'contact_name' => 'Fatima Al-Zahrani',
            'industry' => 'Technology',
            'company_size' => '51-200',
            'founded_year' => 2018,
            'website' => 'https://techcorp.test',
            'linkedin_url' => 'https://linkedin.com/company/techcorp',
            'about' => 'We hire across the GCC.',
            'address' => 'Riyadh',
            'phone' => '+966 11 000 0000',
            'email' => $employer->email,
        ])
        ->assertRedirect();

    $employer->refresh();

    expect($employer->company_size)->toBe('51-200')
        ->and($employer->founded_year)->toBe(2018)
        ->and($employer->linkedin_url)->toBe('https://linkedin.com/company/techcorp');

    $this->actingAs($employer)
        ->get(route('employer.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('profile.company_name', 'TechCorp Solutions')
            ->where('completion.sections.social', true)
            ->has('completion.percent'));
});
