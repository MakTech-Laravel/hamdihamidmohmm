<?php

use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Support\JobSeekerCvExtractor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('cv extractor fills profile fields from a text based resume document', function () {
    $content = <<<'TXT'
Sara Ali
Software Engineer
Dubai
sara.ali@example.com
+971 50 111 2222
https://linkedin.com/in/sara-ali
https://github.com/saraali

Summary
Experienced full stack developer building hiring products.

Skills
Laravel, React, MySQL, Tailwind

Experience
Backend Developer at Acme - 2021 - Present
Frontend Engineer - Bright Labs - 2019 - 2021

Education
BSc Computer Science - 2015 - 2019

Languages
English Advanced
Arabic Native
French Intermediate

Certifications
AWS Certified Developer 2024
TXT;

    $path = sys_get_temp_dir() . '/cv-extractor-' . uniqid('', true) . '.docx';

    $zip = new ZipArchive;
    expect($zip->open($path, ZipArchive::CREATE))->toBeTrue();
    $zip->addFromString(
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    $zip->addFromString(
        'word/document.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' .
            collect(preg_split("/\n/", $content) ?: [])
            ->map(fn(string $line): string => '<w:p><w:r><w:t>' . htmlspecialchars($line, ENT_XML1) . '</w:t></w:r></w:p>')
            ->implode('') .
            '</w:body></w:document>',
    );
    $zip->close();

    $file = new UploadedFile($path, 'sara-cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', null, true);
    $extracted = JobSeekerCvExtractor::extract($file);

    expect($extracted['name'])->toBe('Sara Ali')
        ->and($extracted['phone'])->toContain('971')
        ->and($extracted['location'])->toBe('Dubai')
        ->and($extracted['skills'])->toContain('Laravel')
        ->and($extracted['languages'])->toContain(['name' => 'Arabic', 'level' => 'Native'])
        ->and($extracted['education'])->not->toBeEmpty()
        ->and($extracted['experience'])->not->toBeEmpty();

    @unlink($path);
});

test('cv extractor rejects binary pdf garbage instead of filling profile fields', function () {
    $binary = "%PDF-1.4\n1 0 obj<<>>endobj\nstream\n(\xD3L\xEE\x9AQ\xE3\x80\xFF\x00bad)\nendstream\n%%EOF";
    $path = sys_get_temp_dir() . '/cv-binary-' . uniqid('', true) . '.pdf';
    file_put_contents($path, $binary);

    $file = new UploadedFile($path, 'binary.pdf', 'application/pdf', null, true);
    $extracted = JobSeekerCvExtractor::extract($file);

    expect($extracted['headline'])->toBeNull()
        ->and($extracted['current_title'])->toBeNull()
        ->and($extracted['name'])->toBeNull()
        ->and($extracted['skills'])->toBe([])
        ->and($extracted['education'])->toBe([])
        ->and($extracted['experience'])->toBe([]);

    @unlink($path);
});

test('uploading a cv with extract_profile fills empty job seeker profile fields', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'seeker@example.com',
        'email' => 'seeker@example.com',
        'phone' => null,
        'location' => null,
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => null,
        'skills' => [],
        'education' => [],
        'experience' => [],
        'languages' => [],
        'certifications' => [],
    ]);

    $pdf = <<<'PDF'
%PDF-1.4
1 0 obj<<>>endobj
2 0 obj<< /Length 3 0 R >>stream
BT
(Noura Saeed) Tj
(Full Stack Developer) Tj
(Jeddah) Tj
(+966 50 123 4567) Tj
(Skills) Tj
(Laravel, React) Tj
(Languages) Tj
(English Advanced) Tj
(Arabic Native) Tj
(Education) Tj
(BSc Software Engineering 2016 - 2020) Tj
(Experience) Tj
(Software Engineer at Acme 2021 - Present) Tj
ET
endstream
endobj
3 0 obj
144
endobj
trailer<<>>
%%EOF
PDF;

    $resume = UploadedFile::fake()->createWithContent('noura-cv.pdf', $pdf);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.resume.upload'), [
            'resume' => $resume,
            'extract_profile' => true,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();
    $profile = $seeker->jobSeekerProfile;

    expect($seeker->resume_original_name)->toBe('noura-cv.pdf')
        ->and($seeker->name)->toBe('Noura Saeed')
        ->and($seeker->phone)->toContain('966')
        ->and($seeker->location)->toBe('Jeddah')
        ->and($profile?->skills)->toContain('Laravel')
        ->and($profile?->languages)->not->toBeEmpty()
        ->and($profile?->education)->not->toBeEmpty()
        ->and($profile?->experience)->not->toBeEmpty();
});
