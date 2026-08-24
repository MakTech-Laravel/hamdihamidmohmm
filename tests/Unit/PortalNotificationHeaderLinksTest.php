<?php

$resources = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'resources';

it('links portal notification buttons to their notifications pages', function (string $relativePath, string $href) use ($resources) {
    $path = $resources . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    $contents = file_get_contents($path);

    expect($contents)->not->toBeFalse()
        ->toContain("href=\"{$href}\"");
})->with([
    'admin portal header' => [
        'js/layouts/partials/admin-portal/header.tsx',
        '/admin/notifications',
    ],
    'employer header' => [
        'js/layouts/partials/employer/header.tsx',
        '/employer/notifications',
    ],
    'job seeker header' => [
        'js/layouts/partials/job-seeker/header.tsx',
        '/job-seeker/notifications',
    ],
]);
