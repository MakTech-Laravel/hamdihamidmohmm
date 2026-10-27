<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

const ATS_SAMPLE_CV = <<<'CV'
John Carter
Email: john.carter@example.com
Phone: +971 50 123 4567
Portfolio: https://johncarter.dev
Professional summary
Full stack web developer building React and TypeScript front ends with Laravel APIs.
Experience
Senior Developer at Acme Labs, 2018 - 2024
Built React dashboards, TypeScript component libraries and Laravel REST APIs for retail clients.
Education
Bachelor of Science in Computer Science, Cairo University
CV;

/**
 * Build a minimal DOCX file containing the given text, one paragraph per line.
 */
function atsDocx(string $text): string
{
    $paragraphs = collect(explode("\n", $text))
        ->map(fn (string $line): string => '<w:p><w:r><w:t>'.htmlspecialchars($line, ENT_XML1).'</w:t></w:r></w:p>')
        ->implode('');

    $path = tempnam(sys_get_temp_dir(), 'ats').'.docx';
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
    $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'.$paragraphs.'</w:body></w:document>');
    $zip->close();

    $contents = (string) file_get_contents($path);
    @unlink($path);

    return $contents;
}

/**
 * Create an application whose CV snapshot is stored on the (faked) local disk.
 *
 * @param  array<string, mixed>  $jobAttributes
 * @param  array<string, mixed>  $applicationAttributes
 */
function atsApplication(
    array $jobAttributes = [],
    ?string $cvText = ATS_SAMPLE_CV,
    string $extension = 'docx',
    array $applicationAttributes = [],
    ?User $employer = null,
): JobApplication {
    $employer ??= User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Full Stack Developer',
        'skills' => ['React', 'TypeScript', 'Laravel', 'Docker'],
        'experience_level' => 'Mid Level',
        'requirements' => "<p>Bachelor's degree in Computer Science.</p><p>3+ years building web applications.</p>",
        'description' => '<p>Join our product team to build customer portals.</p>',
        'status' => JobPostStatus::Active,
        ...$jobAttributes,
    ]);

    $path = null;

    if ($cvText !== null) {
        $path = 'resumes/'.$seeker->id.'/application-'.Str::random(8).'.'.$extension;
        Storage::disk('local')->put($path, $extension === 'docx' ? atsDocx($cvText) : $cvText);
    }

    return JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
        'resume_path' => $path,
        'resume_original_name' => $path !== null ? 'john-carter-cv.'.$extension : null,
        ...$applicationAttributes,
    ]);
}

/**
 * @return array<string, mixed>
 */
function atsAiEvaluation(array $overrides = []): array
{
    return [
        'skills_score' => 80,
        'matched_skills' => ['React', 'TypeScript', 'Laravel'],
        'missing_skills' => ['Docker'],
        'experience_score' => 70,
        'experience_reason' => 'Six years building web applications.',
        'education_score' => 90,
        'education_reason' => 'Holds a computer science degree.',
        'strengths' => ['Strong React and Laravel experience'],
        'gaps' => ['No Docker experience mentioned'],
        'summary' => 'Experienced full stack developer who matches most of the required stack.',
        'recommendation' => 'strong_match',
        ...$overrides,
    ];
}
