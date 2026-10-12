<?php

use App\Ai\Tools\GetApplicationInsights;
use App\Ai\Tools\GetInboxInsights;
use App\Ai\Tools\GetJobInsights;
use App\Ai\Tools\GetMyApplications;
use App\Ai\Tools\GetPaymentInsights;
use App\Ai\Tools\GetPlatformOverview;
use App\Ai\Tools\GetSupportContacts;
use App\Ai\Tools\ListPricingPlans;
use App\Ai\Tools\ListTrainingCourses;
use App\Ai\Tools\SearchJobs;
use App\Ai\Tools\SearchUsers;
use App\Enums\JobApplicationStatus;
use App\Enums\PaymentStatus;
use App\Models\ContactMessage;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\TrainingCourse;
use App\Models\User;
use Laravel\Ai\Tools\Request;

/**
 * @param  array<string, mixed>  $arguments
 * @return array<string, mixed>
 */
function runAiTool(object $tool, array $arguments = []): array
{
    return json_decode((string) $tool->handle(new Request($arguments)), true, flags: JSON_THROW_ON_ERROR);
}

test('job search returns live jobs using the public filters', function () {
    $match = JobPost::factory()->create([
        'title' => 'Senior Laravel Developer',
        'location' => 'Khartoum',
        'employment_type' => 'Full-time',
    ]);
    JobPost::factory()->create(['title' => 'Laravel Intern', 'location' => 'Khartoum', 'employment_type' => 'Internship']);
    JobPost::factory()->pending()->create(['title' => 'Pending Laravel Role', 'location' => 'Khartoum']);
    JobPost::factory()->create(['title' => 'Accountant', 'location' => 'Khartoum']);

    $result = runAiTool(new SearchJobs, [
        'keyword' => 'Laravel',
        'location' => 'Khartoum',
        'employment_type' => 'Full-time',
    ]);

    expect($result['total_matches'])->toBe(1)
        ->and($result['jobs'][0]['title'])->toBe('Senior Laravel Developer')
        ->and($result['jobs'][0]['url'])->toBe('/jobs/'.$match->slug)
        ->and($result['browse_all_url'])->toContain('search=Laravel')
        ->and($result)->toHaveKey('available_filters');
});

test('job search caps the number of results', function () {
    JobPost::factory()->count(10)->create();

    $result = runAiTool(new SearchJobs, ['limit' => 50]);

    expect($result['total_matches'])->toBe(10)
        ->and($result['jobs'])->toHaveCount(8);
});

test('pricing tool lists only public active packages', function () {
    Package::factory()->create(['name' => 'Visible Plan', 'price' => 999]);
    Package::factory()->create(['name' => 'Hidden Plan', 'is_public' => false]);
    Package::factory()->create(['name' => 'Inactive Plan', 'is_active' => false]);

    $result = runAiTool(new ListPricingPlans);

    expect(collect($result['plans'])->pluck('name')->all())->toBe(['Visible Plan'])
        ->and($result['plans'][0]['price'])->toBe(999)
        ->and($result['pricing_url'])->toBe('/pricing');
});

test('training tool lists published courses with registration links', function () {
    $course = TrainingCourse::factory()->create(['title' => 'Project Management Basics']);
    TrainingCourse::factory()->unpublished()->create(['title' => 'Draft Course']);

    $result = runAiTool(new ListTrainingCourses);

    expect(collect($result['courses'])->pluck('title')->all())->toBe(['Project Management Basics'])
        ->and($result['courses'][0]['register_url'])->toBe('/training/courses/'.$course->slug.'/register');
});

test('support tool returns the configured contact details', function () {
    PlatformSetting::query()->create([
        'key' => 'general',
        'value' => ['support_email' => 'care@example.com', 'support_phone' => '+249 111 222 333'],
    ]);

    $result = runAiTool(new GetSupportContacts);

    expect($result['support_email'])->toBe('care@example.com')
        ->and($result['support_phone'])->toBe('+249 111 222 333')
        ->and($result['contact_form_url'])->toBe('/contact');
});

test('my applications tool only returns the signed in job seeker applications', function () {
    $jobSeeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create(['title' => 'Data Analyst']);
    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $jobSeeker->id,
        'status' => JobApplicationStatus::Shortlisted,
    ]);
    JobApplication::factory()->create(['status' => JobApplicationStatus::Hired]);

    $result = runAiTool(new GetMyApplications($jobSeeker));

    expect($result['total_applications'])->toBe(1)
        ->and($result['recent_applications'][0]['job'])->toBe('Data Analyst')
        ->and($result['recent_applications'][0]['status'])->toBe(JobApplicationStatus::Shortlisted->label());
});

test('platform overview reuses the admin dashboard figures', function () {
    User::factory()->count(2)->employer()->create();
    User::factory()->pendingEmployer()->create();
    JobPost::factory()->pending()->create();

    $result = runAiTool(app(GetPlatformOverview::class));

    expect($result['stats']['pending_verifications'])->toBe(1)
        ->and($result['stats']['pending_jobs'])->toBe(1)
        ->and($result['alerts'])->not->toBeEmpty()
        ->and($result)->toHaveKeys(['employer_packages', 'recent_activity']);
});

test('application insights group applications by status', function () {
    JobApplication::factory()->count(2)->create();
    JobApplication::factory()->create(['status' => JobApplicationStatus::Rejected]);

    $result = runAiTool(new GetApplicationInsights, ['days' => 7]);

    expect($result['total'])->toBe(3)
        ->and($result['by_status'][JobApplicationStatus::Applied->label()])->toBe(2)
        ->and($result['by_status'][JobApplicationStatus::Rejected->label()])->toBe(1)
        ->and($result['last_7_days'])->toBe(3)
        ->and($result['latest_applications'])->toHaveCount(3);
});

test('job insights list jobs waiting for review', function () {
    JobPost::factory()->pending()->create(['title' => 'Needs Review']);
    JobPost::factory()->create();

    $result = runAiTool(new GetJobInsights);

    expect($result['total'])->toBe(2)
        ->and($result['live_now'])->toBe(1)
        ->and($result['pending_review'][0]['title'])->toBe('Needs Review');
});

test('payment insights summarise revenue and pending payments', function () {
    Payment::factory()->create(['amount' => 1000, 'status' => PaymentStatus::Completed, 'paid_at' => now()]);
    Payment::factory()->create(['amount' => 500, 'status' => PaymentStatus::Completed, 'paid_at' => now()->subYear()]);
    Payment::factory()->create(['amount' => 300, 'status' => PaymentStatus::Pending, 'paid_at' => null]);

    $result = runAiTool(new GetPaymentInsights);

    expect($result['revenue_all_time'])->toBe(1500)
        ->and($result['revenue_this_month'])->toBe(1000)
        ->and($result['by_status'][PaymentStatus::Pending->label()]['payments'])->toBe(1)
        ->and($result['pending_payments'][0]['amount'])->toBe(300);
});

test('inbox insights count unread contact messages', function () {
    ContactMessage::factory()->count(2)->create();
    ContactMessage::factory()->read()->create();

    $result = runAiTool(new GetInboxInsights);

    expect($result['contact_messages']['unread'])->toBe(2)
        ->and($result['contact_messages']['total'])->toBe(3)
        ->and($result['contact_messages']['latest_unread'])->toHaveCount(2);
});

test('user search finds accounts and can filter by role', function () {
    $employer = User::factory()->employer()->create(['email' => 'hr@acme-sudan.com', 'company_name' => 'Acme Sudan']);
    User::factory()->jobSeeker()->create(['email' => 'acme.fan@example.com']);

    $all = runAiTool(new SearchUsers, ['query' => 'acme']);
    $employers = runAiTool(new SearchUsers, ['query' => 'acme', 'role' => 'employer']);

    expect($all['matches'])->toBe(2)
        ->and($employers['matches'])->toBe(1)
        ->and($employers['users'][0]['email'])->toBe('hr@acme-sudan.com')
        ->and($employers['users'][0]['admin_url'])->toBe('/admin/employers/'.$employer->id);
});

test('user search requires a meaningful query', function () {
    expect(runAiTool(new SearchUsers, ['query' => 'a']))->toHaveKey('error');
});
