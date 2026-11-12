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

it('keeps safe hex text and highlight colors', function () {
    $clean = SafeHtml::clean(
        '<p><span style="color: #0057c8">Blue</span> <mark style="background-color: #fef08a">Hi</mark></p>',
    );

    expect($clean)->toContain('color: #0057c8')
        ->and($clean)->toContain('background-color: #fef08a')
        ->and($clean)->toContain('Blue');
});

it('strips invalid color values', function () {
    $clean = SafeHtml::clean(
        '<p><span style="color: red; background-color: rgb(0,0,0); color: #00ff00">X</span></p>',
    );

    expect($clean)->toContain('color: #00ff00')
        ->and($clean)->not->toContain('red')
        ->and($clean)->not->toContain('rgb(');
});

it('keeps allowlisted rich icons and drops unknown ones', function () {
    $clean = SafeHtml::clean(
        '<p><span class="rich-text-icon" data-rich-icon="check"></span><span data-rich-icon="not-a-real-icon"></span>Done</p>',
    );

    expect($clean)->toContain('data-rich-icon="check"')
        ->and($clean)->toContain('rich-text-icon')
        ->and($clean)->not->toContain('not-a-real-icon');
});

it('keeps safe responsive tables and strips table inline styles', function () {
    $clean = SafeHtml::clean(
        '<div class="rich-text-table-wrap overflow-x-auto"><table class="rich-text-table w-full border border-[#e2e8f0] rounded-lg" style="color: expression(alert(1))"><thead><tr><th colspan="2">A</th></tr></thead><tbody><tr><td>One</td><td onclick="alert(1)">Two</td></tr></tbody></table></div>',
    );

    expect($clean)->toContain('<table')
        ->and($clean)->toContain('rich-text-table-wrap')
        ->and($clean)->toContain('rounded-lg')
        ->and($clean)->toContain('colspan="2"')
        ->and($clean)->toContain('One')
        ->and($clean)->not->toContain('onclick')
        ->and($clean)->not->toContain('expression');
});

it('keeps hex background colors on table cells only', function () {
    $clean = SafeHtml::clean(
        '<table><tr><td style="background-color: #bfdbfe; color: red">Cell</td></tr></table>',
    );

    expect($clean)->toContain('background-color: #bfdbfe')
        ->and($clean)->not->toContain('color: red')
        ->and($clean)->toContain('Cell');
});
