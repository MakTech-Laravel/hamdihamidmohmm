<?php

namespace Database\Seeders;

use App\Enums\JobTaxonomyType;
use App\Models\JobTaxonomy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JobTaxonomySeeder extends Seeder
{
    public function run(): void
    {
        $sets = [
            JobTaxonomyType::Country->value => [
                'Sudan',
                'United Arab Emirates',
                'Saudi Arabia',
                'Egypt',
                'Qatar',
                'Remote',
            ],
            JobTaxonomyType::DutyStation->value => [
                'Sudan',
                'Khartoum',
                'Omdurman',
                'Bahri',
                'Port Sudan',
                'Kassala',
                'Wad Madani',
                'El Obeid',
                'Nyala',
                'Atbara',
                'Gedaref',
                'El Fasher',
                'Kosti',
                'Remote',
            ],
            JobTaxonomyType::PositionArea->value => [
                'ICT',
                'Technology',
                'Engineering',
                'Design',
                'Marketing',
                'Finance',
                'Healthcare',
                'HR',
                'Sales',
                'Construction',
                'Logistics',
                'Retail',
                'Others',
            ],
            JobTaxonomyType::EmploymentType->value => [
                ['name' => 'Full Time', 'slug' => 'full_time'],
                ['name' => 'Part Time', 'slug' => 'part_time'],
                ['name' => 'Contract', 'slug' => 'contract'],
                ['name' => 'Freelance', 'slug' => 'freelance'],
                ['name' => 'Internship', 'slug' => 'internship'],
                ['name' => 'Remote', 'slug' => 'remote'],
            ],
        ];

        foreach ($sets as $type => $items) {
            foreach (array_values($items) as $index => $item) {
                $name = is_array($item) ? $item['name'] : $item;
                $slug = is_array($item) ? $item['slug'] : Str::slug($name);

                JobTaxonomy::query()->updateOrCreate(
                    [
                        'type' => $type,
                        'slug' => $slug,
                    ],
                    [
                        'name' => $name,
                        'is_active' => true,
                        'sort_order' => $index + 1,
                    ]
                );
            }
        }

        $othersExists = JobTaxonomy::query()
            ->where('type', JobTaxonomyType::PositionArea->value)
            ->where('slug', 'others')
            ->exists();

        if ($othersExists) {
            JobTaxonomy::query()
                ->where('type', JobTaxonomyType::PositionArea->value)
                ->where('slug', 'other')
                ->delete();
        } else {
            JobTaxonomy::query()
                ->where('type', JobTaxonomyType::PositionArea->value)
                ->where('slug', 'other')
                ->update([
                    'name' => 'Others',
                    'slug' => 'others',
                ]);
        }

        JobTaxonomy::forgetOptionsCache();
    }
}
