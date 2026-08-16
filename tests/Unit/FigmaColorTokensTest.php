<?php

$resources = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources';

test('the theme uses the updated Figma color tokens', function () use ($resources) {
    $css = file_get_contents($resources.DIRECTORY_SEPARATOR.'css'.DIRECTORY_SEPARATOR.'app.css');

    expect($css)->not->toBeFalse()
        ->toContain('--primary: #0057c8')
        ->toContain('--secondary: #3977a6')
        ->toContain('--accent: #e57124')
        ->toContain('--cream: #d1f6ff')
        ->toContain('--foreground: #050315')
        ->toContain('--sidebar: #ffffff')
        ->not->toContain('--primary: #0f182e')
        ->not->toContain('--accent: #FAF5FF');
});

test('the public header uses Figma primary and background colors', function () use ($resources) {
    $header = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'header.tsx');

    expect($header)->not->toBeFalse()
        ->toContain('bg-[#0057c8]')
        ->toContain('text-[#d1f6ff]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the admin sidebar uses the Figma white surface and primary blue', function () use ($resources) {
    $sidebar = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'admin-portal'.DIRECTORY_SEPARATOR.'sidebar.tsx');

    expect($sidebar)->not->toBeFalse()
        ->toContain('bg-white')
        ->toContain('text-[#0057c8]')
        ->toContain('text-[#3977a6]')
        ->not->toContain('#ffebf5')
        ->not->toContain('#323981');
});
