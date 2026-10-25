<?php

$resources = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'js';

test('mobile list card helpers expose the shared compact card API', function () use ($resources) {
    $path = $resources.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'mobile-list-card.tsx';
    $source = file_get_contents($path);

    expect($source)->not->toBeFalse()
        ->toContain('export function MobileListCard')
        ->toContain('export function MobileListCardHeader')
        ->toContain('export function MobileListCardMeta')
        ->toContain('export function MobileListCardActions')
        ->toContain('common.more_actions');
});

test('admin table shell supports a mobile cards slot', function () use ($resources) {
    $path = $resources.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'admin-portal'.DIRECTORY_SEPARATOR.'ui.tsx';
    $source = file_get_contents($path);

    expect($source)->not->toBeFalse()
        ->toContain('mobileCards')
        ->toContain('hidden md:block')
        ->toContain('md:hidden');
});

test('dense employer list pages keep desktop tables with mobile cards', function () use ($resources) {
    $pages = [
        'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerJobs.tsx',
        'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerApplications.tsx',
        'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerRoster.tsx',
    ];

    foreach ($pages as $relative) {
        $source = file_get_contents($resources.DIRECTORY_SEPARATOR.$relative);

        expect($source)->not->toBeFalse()
            ->toContain('MobileListCard')
            ->toContain('md:block');
    }
});

test('dense admin list pages pass mobile cards into AdminTableShell', function () use ($resources) {
    $pages = [
        'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'Admin'.DIRECTORY_SEPARATOR.'EmployerManagement.tsx',
        'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'Admin'.DIRECTORY_SEPARATOR.'JobManagement.tsx',
        'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'Admin'.DIRECTORY_SEPARATOR.'ApplicationsMonitoring.tsx',
    ];

    foreach ($pages as $relative) {
        $source = file_get_contents($resources.DIRECTORY_SEPARATOR.$relative);

        expect($source)->not->toBeFalse()
            ->toContain('MobileListCard')
            ->toContain('mobileCards=');
    }
});
