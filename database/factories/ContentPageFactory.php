<?php

namespace Database\Factories;

use App\Enums\ContentPageStatus;
use App\Enums\ContentPageType;
use App\Models\ContentPage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ContentPage>
 */
class ContentPageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'type' => ContentPageType::Page,
            'body' => fake()->paragraphs(4, true),
            'status' => ContentPageStatus::Published,
        ];
    }
}
