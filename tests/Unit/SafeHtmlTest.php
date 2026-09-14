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

it('treats empty editor markup as null', function () {
    expect(SafeHtml::clean('<p></p>'))->toBeNull()
        ->and(SafeHtml::clean('<p><br></p>'))->toBeNull()
        ->and(SafeHtml::clean(''))->toBeNull()
        ->and(SafeHtml::clean(null))->toBeNull();
});

it('keeps plain text descriptions', function () {
    expect(SafeHtml::clean('Plain job description'))->toBe('Plain job description');
});
