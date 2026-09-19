<?php

use App\Enums\JobTaxonomyType;
use App\Models\JobTaxonomy;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;

test('admins can view job filter taxonomies', function () {
    $this->seed(JobTaxonomySeeder::class);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.job-filters.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/JobTaxonomies')
            ->has('items')
            ->has('types', 4)
            ->where('filters.type', ''));
});

test('admins can create update and deactivate a taxonomy option', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.job-filters.store'), [
            'type' => JobTaxonomyType::DutyStation->value,
            'name' => 'Dongola',
            'is_active' => true,
        ])
        ->assertRedirect();

    $item = JobTaxonomy::query()->where('slug', 'dongola')->first();

    expect($item)->not->toBeNull()
        ->and($item?->name)->toBe('Dongola')
        ->and($item?->type)->toBe(JobTaxonomyType::DutyStation)
        ->and($item?->sort_order)->toBeGreaterThan(0);

    $this->actingAs($admin)
        ->put(route('admin.job-filters.update', $item), [
            'type' => JobTaxonomyType::DutyStation->value,
            'name' => 'Dongola City',
            'is_active' => true,
        ])
        ->assertRedirect();

    $item->refresh();

    expect($item->name)->toBe('Dongola City')
        ->and($item->slug)->toBe('dongola-city');

    $this->actingAs($admin)
        ->delete(route('admin.job-filters.destroy', $item))
        ->assertRedirect();

    expect($item->fresh()?->is_active)->toBeFalse();
});

test('taxonomy slug and sort order are generated automatically from the name', function () {
    $admin = User::factory()->admin()->create();

    JobTaxonomy::factory()->dutyStation()->create([
        'name' => 'Existing',
        'slug' => 'existing',
        'sort_order' => 5,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.job-filters.store'), [
            'type' => JobTaxonomyType::DutyStation->value,
            'name' => 'Port Sudan',
            'is_active' => true,
        ])
        ->assertRedirect();

    $created = JobTaxonomy::query()->where('name', 'Port Sudan')->first();

    expect($created)->not->toBeNull()
        ->and($created?->slug)->toBe('port-sudan')
        ->and($created?->sort_order)->toBe(6);

    $this->actingAs($admin)
        ->post(route('admin.job-filters.store'), [
            'type' => JobTaxonomyType::DutyStation->value,
            'name' => 'Port Sudan',
            'is_active' => true,
        ])
        ->assertRedirect();

    expect(JobTaxonomy::query()->where('slug', 'port-sudan-2')->exists())->toBeTrue();
});

test('non admins cannot manage job filters', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('admin.job-filters.index'))
        ->assertRedirect();
});
