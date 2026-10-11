<?php

use App\Models\PlatformSetting;
use App\Models\User;
use App\Notifications\ApplicationSubmittedNotification;
use App\Notifications\JobRejectedNotification;
use App\Support\MailBranding;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

function renderMail(MailMessage $message): string
{
    return (string) $message->render();
}

test('application submitted email matches the branded design', function () {
    config(['app.name' => 'RRjob']);

    $html = renderMail((new ApplicationSubmittedNotification('ICT Senior Analyst', 'Gulf Tech'))
        ->toMail((object) ['name' => 'Mohammed Zaroog']));

    expect($html)
        ->toContain('images/email/header.jpg')
        ->toContain('images/email/footer-wave.png')
        ->toContain('Dear Mohammed Zaroog,')
        ->toContain('Thank you for applying through RRjob for the position of ICT Senior Analyst at Gulf Tech. We confirm receipt of your application.')
        ->toContain('Only shortlisted candidates will be contacted for the assessment phase')
        ->toContain('reasonable accommodation during the assessment')
        ->toContain('>application status</a>')
        ->toContain(url('/job-seeker/applications'))
        ->toContain('RRjob Talent Acquisition')
        ->toContain('(Automated Notification - Do Not Reply)')
        ->toContain('© ' . now()->year . ' RRjob')
        ->toContain('Privacy Policy')
        ->toContain('Terms &amp; Conditions')
        ->not->toContain('If you’re having trouble clicking');
});

test('default notification emails use the branded header, button, and footer', function () {
    $html = renderMail((new JobRejectedNotification('Senior Accountant', 'Missing salary details'))
        ->toMail((object) ['name' => 'Layla Hassan']));

    expect($html)
        ->toContain('images/email/header.jpg')
        ->toContain('#0256ae')
        ->toContain('Best regards,')
        ->toContain('(Automated Notification - Do Not Reply)')
        ->not->toContain('All rights reserved');
});

test('framework password reset email uses the branded layout', function () {
    $html = renderMail((new ResetPassword('reset-token'))->toMail(User::factory()->create()));

    expect($html)
        ->toContain('images/email/header.jpg')
        ->toContain('images/email/footer-wave.png')
        ->toContain('background:#0067d8');
});

test('email footer shows only configured social links', function () {
    PlatformSetting::query()->updateOrCreate(
        ['key' => 'social'],
        ['value' => [
            'facebook_url' => 'facebook.com/rrjob',
            'twitter_url' => '',
            'linkedin_url' => 'https://linkedin.com/company/rrjob',
            'instagram_url' => '#',
        ]],
    );

    $links = MailBranding::socialLinks();

    expect($links)->toHaveCount(2)
        ->and($links[0]['label'])->toBe('Facebook')
        ->and($links[0]['url'])->toBe('https://facebook.com/rrjob')
        ->and($links[0]['icon'])->toContain('images/email/facebook.png')
        ->and($links[1]['label'])->toBe('LinkedIn')
        ->and($links[1]['url'])->toBe('https://linkedin.com/company/rrjob');

    $html = renderMail((new ApplicationSubmittedNotification('Analyst', 'Gulf Tech'))
        ->toMail((object) ['name' => 'Sara']));

    expect($html)
        ->toContain('images/email/facebook.png')
        ->toContain('images/email/linkedin.png')
        ->not->toContain('images/email/x.png')
        ->not->toContain('images/email/instagram.png');
});

test('email images exist in the public directory', function (string $path) {
    expect(public_path($path))->toBeFile();
})->with([
    'images/email/header.jpg',
    'images/email/footer-wave.png',
    'images/email/facebook.png',
    'images/email/x.png',
    'images/email/linkedin.png',
    'images/email/instagram.png',
]);
