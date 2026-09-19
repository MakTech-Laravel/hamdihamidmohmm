<?php

$resources = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources';

test('native select component uses a styled radix dropdown', function () use ($resources) {
    $path = $resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'ui'.DIRECTORY_SEPARATOR.'native-select.tsx';

    expect(file_exists($path))->toBeTrue();

    $contents = file_get_contents($path);

    expect($contents)->not->toBeFalse()
        ->toContain('data-slot="native-select"')
        ->toContain("from '@/components/ui/select'")
        ->toContain('type NativeSelectVariant')
        ->toContain('SelectContent')
        ->toContain('SelectItem')
        ->toContain('data-[state=checked]:text-[#0057c8]')
        ->toContain('rounded-2xl')
        ->toContain('shadow-[0_18px_40px_rgba(5,3,21,0.14)]')
        ->not->toContain('appearance-none');
});

test('home and jobs pages use the shared location combobox for location filters', function () use ($resources) {
    $home = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'home.tsx');
    $jobs = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'jobs.tsx');
    $searchForm = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'job-search-form.tsx');
    $combobox = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'location-combobox.tsx');

    expect($home)->not->toBeFalse()
        ->toContain("from '@/components/frontend/job-search-form'")
        ->toContain('JobSearchForm');

    expect($searchForm)->not->toBeFalse()
        ->toContain("from '@/components/frontend/location-combobox'")
        ->toContain('LocationCombobox');

    expect($combobox)->not->toBeFalse()
        ->toContain('useCustomLabel')
        ->toContain('Search locations');

    expect($jobs)->not->toBeFalse()
        ->toContain("from '@/components/frontend/location-combobox'")
        ->toContain('LocationCombobox')
        ->toContain("from '@/components/ui/native-select'")
        ->toContain('variant="filter"')
        ->toContain('variant="compact"');
});
