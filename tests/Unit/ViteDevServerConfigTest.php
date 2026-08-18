<?php

test('the vite dev server is pinned to localhost so browser scripts are not blocked by cors', function () {
    $config = file_get_contents(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'vite.config.ts');

    expect($config)->not->toBeFalse()
        ->toContain("host: 'localhost'")
        ->toContain("origin: 'http://localhost:5173'")
        ->toContain("'http://localhost:8000'")
        ->toContain("'http://127.0.0.1:8000'")
        ->toContain('strictPort: true');
});
