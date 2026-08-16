<?php

$resources = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'resources';

test('the theme uses the updated Figma color tokens', function () use ($resources) {
    $css = file_get_contents($resources . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'app.css');

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

test('buttons use a pointer cursor on hover', function () use ($resources) {
    $css = file_get_contents($resources . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'app.css');

    expect($css)->not->toBeFalse()
        ->toContain("button:not(:disabled)")
        ->toContain('cursor: pointer');
});

test('the public header uses Figma primary and background colors', function () use ($resources) {
    $header = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'header.tsx');

    expect($header)->not->toBeFalse()
        ->toContain('bg-[#0057c8]')
        ->toContain('text-[#d1f6ff]')
        ->toContain('text-[#1c398e]')
        ->toContain('bg-[#1e3a8a]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the public home hero uses Figma accent and floating stat colors', function () use ($resources) {
    $home = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'home.tsx');

    expect($home)->not->toBeFalse()
        ->toContain('text-[#e57124]')
        ->toContain('lg:text-[64px]')
        ->toContain('lg:leading-[76px]')
        ->toContain('h-[60px]')
        ->toContain('text-[#1e3a8a]')
        ->toContain('text-[#f97316]')
        ->not->toContain('text-[#c2410c]');
});

test('the public footer uses Figma LinkedIn social icons', function () use ($resources) {
    $footer = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'footer.tsx');

    expect($footer)->not->toBeFalse()
        ->toContain("src: '/images/home/linkedin.svg'")
        ->toContain("src: '/images/home/x.svg'")
        ->toContain("src: '/images/home/facebook.svg'")
        ->not->toContain('instagram.svg');
});

test('the public pricing page includes the Figma three-package layout', function () use ($resources) {
    $pricing = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'components' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'pricing-package-cards.tsx');

    expect($pricing)->not->toBeFalse()
        ->toContain('lg:grid-cols-3')
        ->toContain('packages.map')
        ->toContain('is_featured')
        ->toContain('bg-[#0057c8]')
        ->not->toContain('bg-[#3977a6] p-7');
});

test('the admin sidebar uses the Figma white surface and primary blue', function () use ($resources) {
    $sidebar = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'admin-portal' . DIRECTORY_SEPARATOR . 'sidebar.tsx');

    expect($sidebar)->not->toBeFalse()
        ->toContain('bg-white')
        ->toContain('text-[#0057c8]')
        ->toContain('text-[#3977a6]')
        ->not->toContain('#ffebf5')
        ->not->toContain('#323981');
});
