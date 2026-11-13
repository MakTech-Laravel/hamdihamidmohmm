<?php

use App\Models\JobPost;
use App\Models\User;
use App\Support\SafeHtml;
use Database\Seeders\JobTaxonomySeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('safe html keeps external links that open in a new tab', function () {
    $html = '<p>Apply on <a href="https://careers.example.com/apply" onclick="alert(1)">our portal</a></p>';

    $clean = SafeHtml::clean($html);

    expect($clean)->toContain('href="https://careers.example.com/apply"')
        ->and($clean)->toContain('target="_blank"')
        ->and($clean)->toContain('rel="noopener noreferrer"')
        ->and($clean)->not->toContain('onclick');
});

test('safe html keeps youtube embeds and strips other iframes', function () {
    $html = '<div data-youtube-video class="youtube-embed"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe></div><iframe src="https://evil.test/embed"></iframe>';

    $clean = SafeHtml::clean($html);

    expect($clean)->toContain('youtube.com/embed/dQw4w9WgXcQ')
        ->and($clean)->toContain('data-youtube-video')
        ->and($clean)->not->toContain('evil.test');
});

test('safe html strips javascript links', function () {
    $clean = SafeHtml::clean('<a href="javascript:alert(1)">bad</a>');

    expect($clean)->not->toContain('javascript')
        ->and($clean)->not->toContain('<a');
});

test('employers can upload pdf attachments for job descriptions', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create();
    $file = UploadedFile::fake()->create('P11-form.pdf', 200, 'application/pdf');

    $response = $this->actingAs($employer)
        ->postJson(route('employer.jobs.description-attachments.store'), [
            'file' => $file,
        ])
        ->assertOk()
        ->assertJsonStructure(['url', 'name'])
        ->assertJsonPath('name', 'P11-form.pdf');

    $url = $response->json('url');

    expect($url)->toStartWith('/storage/job-description-attachments/'.$employer->id.'/');
});

test('job seekers cannot upload job description attachments', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $file = UploadedFile::fake()->create('form.pdf', 100, 'application/pdf');

    $this->actingAs($seeker)
        ->postJson(route('employer.jobs.description-attachments.store'), [
            'file' => $file,
        ])
        ->assertRedirect();
});

test('employers can save colored text curated icons and responsive tables in descriptions', function () {
    $this->seed(JobTaxonomySeeder::class);

    $employer = User::factory()->employer()->create();

    $description = <<<'HTML'
<p><span style="color: #0057c8">Blue role</span> <span class="rich-text-icon" data-rich-icon="check"></span></p>
<div class="rich-text-table-wrap overflow-x-auto"><table class="rich-text-table w-full border border-[#e2e8f0] rounded-lg"><tbody><tr><td>Shift</td><td>Day</td></tr></tbody></table></div>
HTML;

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Colored Role',
            'category' => 'technology',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'mid-level',
            'description' => $description,
            'publish' => false,
        ])
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->description)->toContain('color: #0057c8')
        ->and($job->description)->toContain('data-rich-icon="check"')
        ->and($job->description)->toContain('<table')
        ->and($job->description)->toContain('rich-text-table-wrap')
        ->and($job->description)->toContain('Day');
});
