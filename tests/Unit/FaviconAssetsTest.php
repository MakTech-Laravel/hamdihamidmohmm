<?php

$root = dirname(__DIR__, 2);
$public = $root.DIRECTORY_SEPARATOR.'public';
$blade = $root.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'views'.DIRECTORY_SEPARATOR.'app.blade.php';

test('brand favicon assets exist and are linked from the app shell', function () use ($public, $blade) {
    foreach ([
        'favicon.ico',
        'favicon.svg',
        'favicon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'favicon-192x192.png',
        'favicon-512x512.png',
    ] as $file) {
        $path = $public.DIRECTORY_SEPARATOR.$file;

        expect(is_file($path))->toBeTrue("Missing public/{$file}");
        expect(filesize($path))->toBeGreaterThan(0);
    }

    $contents = file_get_contents($blade);

    expect($contents)->not->toBeFalse()
        ->toContain('href="/favicon.ico"')
        ->toContain('href="/favicon.svg"')
        ->toContain('href="/favicon-32x32.png"')
        ->toContain('href="/favicon-16x16.png"')
        ->toContain('href="/apple-touch-icon.png"');
});
