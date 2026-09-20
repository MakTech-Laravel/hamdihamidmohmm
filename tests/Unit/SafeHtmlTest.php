<?php

use App\Support\SafeHtml;

it('keeps safe formatting tags and styles', function () {
    $html = '<p style="text-align: center"><strong class="font-bold">Hello</strong> <span style="font-size: 18px">world</span></p><ul><li>One</li></ul>';

    $clean = SafeHtml::clean($html);

    expect($clean)->toContain('<strong')
        ->and($clean)->toContain('Hello')
        ->and($clean)->toContain('font-bold')
        ->and($clean)->toContain('font-size: 18px')
        ->and($clean)->toContain('text-align: center')
        ->and($clean)->toContain('<li>One</li>');
});

it('strips scripts and unsafe attributes', function () {
    $html = '<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>';

    $clean = SafeHtml::clean($html);

    expect($clean)->toContain('Safe')
        ->and($clean)->not->toContain('script')
        ->and($clean)->not->toContain('onclick')
        ->and($clean)->not->toContain('javascript')
        ->and($clean)->not->toContain('<a');
});

it('keeps safe http links with new-tab attributes', function () {
    $clean = SafeHtml::clean('<p><a href="https://example.com/jobs">Apply</a></p>');

    expect($clean)->toContain('href="https://example.com/jobs"')
        ->and($clean)->toContain('target="_blank"')
        ->and($clean)->toContain('rel="noopener noreferrer"');
});

it('keeps youtube embed iframes only', function () {
    $clean = SafeHtml::clean('<iframe src="https://www.youtube.com/embed/abc123"></iframe><iframe src="https://example.com/x"></iframe>');

    expect($clean)->toContain('youtube.com/embed/abc123')
        ->and($clean)->not->toContain('example.com/x');
});

it('treats empty editor markup as null', function () {
    expect(SafeHtml::clean('<p></p>'))->toBeNull()
        ->and(SafeHtml::clean('<p><br></p>'))->toBeNull()
        ->and(SafeHtml::clean(''))->toBeNull()
        ->and(SafeHtml::clean(null))->toBeNull();
});

it('keeps plain text descriptions', function () {
    expect(SafeHtml::clean('Plain job description'))->toBe('Plain job description');
});
