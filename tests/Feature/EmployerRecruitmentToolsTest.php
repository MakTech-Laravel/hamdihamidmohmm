<?php

use App\Enums\Gender;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;

/**
 * @param  array<string, mixed>  $profile
 */
function applyToJob(JobPost $job, string $name, array $profile, JobApplicationStatus $status = JobApplicationStatus::Applied): JobApplication
{
    $seeker = User::factory()->jobSeeker()->create(['name' => $name]);

    JobSeekerProfile::factory()->create(['user_id' => $seeker->id, ...$profile]);

    return JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => $status,
    ]);
}

beforeEach(function () {
    $this->employer = User::factory()->employer()->create();
    $this->job = JobPost::factory()->create([
        'employer_id' => $this->employer->id,
        'status' => JobPostStatus::Active,
    ]);
});

test('applications default to the most experienced candidates first', function () {
    applyToJob($this->job, 'Junior', ['experience_years' => '2']);
    applyToJob($this->job, 'Senior', ['experience_years' => '12']);
    applyToJob($this->job, 'Mid', ['experience_years' => '6']);

    $this->actingAs($this->employer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.sort', 'experience')
            ->where('applications.0.name', 'Senior')
            ->where('applications.1.name', 'Mid')
            ->where('applications.2.name', 'Junior'));
});

test('applications can be sorted by qualification and certificates', function () {
    applyToJob($this->job, 'Diploma Holder', [
        'education' => [['degree' => 'Diploma in IT']],
        'certifications' => [['name' => 'A'], ['name' => 'B'], ['name' => 'C']],
    ]);
    applyToJob($this->job, 'Master Holder', [
        'education' => [['degree' => 'MSc Computer Science']],
        'certifications' => [['name' => 'A']],
    ]);

    $this->actingAs($this->employer)
        ->get(route('employer.applications', ['sort' => 'qualification']))
        ->assertInertia(fn ($page) => $page
            ->where('applications.0.name', 'Master Holder')
            ->where('applications.0.qualification', 'MSc Computer Science'));

    $this->actingAs($this->employer)
        ->get(route('employer.applications', ['sort' => 'certificates']))
        ->assertInertia(fn ($page) => $page
            ->where('applications.0.name', 'Diploma Holder')
            ->where('applications.0.certificate_count', 3));
});

test('applications expose gender statistics and status counts', function () {
    applyToJob($this->job, 'A', ['gender' => Gender::Female], JobApplicationStatus::Longlisted);
    applyToJob($this->job, 'B', ['gender' => Gender::Male], JobApplicationStatus::UnderConsideration);
    applyToJob($this->job, 'C', ['gender' => Gender::Male], JobApplicationStatus::Shortlisted);
    applyToJob($this->job, 'D', ['gender' => Gender::Male]);

    $this->actingAs($this->employer)
        ->get(route('employer.applications'))
        ->assertInertia(fn ($page) => $page
            ->where('gender_stats.total', 4)
            ->where('gender_stats.male', 3)
            ->where('gender_stats.female', 1)
            ->where('gender_stats.male_percent', 75)
            ->where('gender_stats.female_percent', 25)
            ->where('status_counts.longlisted', 1)
            ->where('status_counts.under_consideration', 1)
            ->where('status_counts.shortlisted', 1));
});

test('employers can bulk update only their own applications', function () {
    $own = applyToJob($this->job, 'Own', []);

    $otherJob = JobPost::factory()->create(['status' => JobPostStatus::Active]);
    $foreign = applyToJob($otherJob, 'Foreign', []);

    $this->actingAs($this->employer)
        ->put(route('employer.applications.bulk-update'), [
            'ids' => [$own->id, $foreign->id],
            'status' => JobApplicationStatus::Shortlisted->value,
        ])
        ->assertRedirect();

    expect($own->fresh()->status)->toBe(JobApplicationStatus::Shortlisted)
        ->and($foreign->fresh()->status)->toBe(JobApplicationStatus::Applied);
});

test('employers can set longlisted and under consideration statuses', function () {
    $application = applyToJob($this->job, 'Candidate', []);

    foreach ([JobApplicationStatus::Longlisted, JobApplicationStatus::UnderConsideration] as $status) {
        $this->actingAs($this->employer)
            ->put(route('employer.applications.update', $application), ['status' => $status->value])
            ->assertRedirect();

        expect($application->fresh()->status)->toBe($status)
            ->and($application->fresh()->timeline())->toHaveCount(2);
    }
});

test('employers can export a recruitment report as an excel file', function () {
    applyToJob($this->job, 'Sara Ali', [
        'gender' => Gender::Female,
        'nationality' => 'Sudanese',
    ]);

    $response = $this->actingAs($this->employer)
        ->get(route('employer.applications.export', ['job_id' => $this->job->id]))
        ->assertOk()
        ->assertDownload();

    expect($response->headers->get('content-disposition'))->toContain('.xlsx');

    $path = tempnam(sys_get_temp_dir(), 'xlsx');
    file_put_contents($path, $response->baseResponse->getContent());

    $zip = new ZipArchive;
    expect($zip->open($path))->toBeTrue();

    $sheet = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    unlink($path);

    expect($sheet)->toContain('Sara Ali')
        ->toContain('Sudanese')
        ->toContain('Female')
        ->toContain('Nationality');
});

test('employers cannot export another employers job report', function () {
    $otherJob = JobPost::factory()->create(['status' => JobPostStatus::Active]);
    applyToJob($otherJob, 'Foreign Candidate', []);

    $response = $this->actingAs($this->employer)
        ->get(route('employer.applications.export', ['job_id' => $otherJob->id]))
        ->assertNotFound();

    expect($response->getContent())->not->toContain('Foreign Candidate');
});

test('employer jobs list exposes job reference, closing date and shortlist count', function () {
    applyToJob($this->job, 'Short', [], JobApplicationStatus::Shortlisted);

    $this->actingAs($this->employer)
        ->get(route('employer.jobs'))
        ->assertInertia(fn ($page) => $page
            ->where('jobs.0.reference', 'JOB-'.str_pad((string) $this->job->id, 5, '0', STR_PAD_LEFT))
            ->where('jobs.0.shortlisted', 1)
            ->has('jobs.0.expires_at'));
});

test('shortlist query shows only shortlisted applications', function () {
    applyToJob($this->job, 'Applied Candidate', []);
    applyToJob($this->job, 'Shortlisted Candidate', [], JobApplicationStatus::Shortlisted);

    $this->actingAs($this->employer)
        ->get(route('employer.applications', ['shortlist' => 1]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.shortlist', true)
            ->where('filters.status', JobApplicationStatus::Shortlisted->value)
            ->has('applications', 1)
            ->where('applications.0.name', 'Shortlisted Candidate'));
});

test('applications without shortlist still list every status', function () {
    applyToJob($this->job, 'Applied Candidate', []);
    applyToJob($this->job, 'Shortlisted Candidate', [], JobApplicationStatus::Shortlisted);

    $this->actingAs($this->employer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.shortlist', false)
            ->where('filters.status', '')
            ->has('applications', 2));
});
