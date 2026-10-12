<?php

namespace Database\Factories;

use App\Enums\AiChatChannel;
use App\Enums\AiChatStatus;
use App\Models\AiChatLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiChatLog>
 */
class AiChatLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'channel' => AiChatChannel::Public,
            'session_key' => hash('sha256', fake()->uuid()),
            'locale' => 'en',
            'question' => fake()->sentence(8),
            'answer' => fake()->paragraph(),
            'status' => AiChatStatus::Answered,
            'input_tokens' => fake()->numberBetween(50, 800),
            'output_tokens' => fake()->numberBetween(20, 400),
            'duration_ms' => fake()->numberBetween(300, 4000),
            'error' => null,
            'ip_address' => fake()->ipv4(),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'channel' => AiChatChannel::Admin,
        ]);
    }

    public function fallback(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AiChatStatus::Fallback,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AiChatStatus::Failed,
            'answer' => null,
            'error' => 'Provider unavailable',
        ]);
    }
}
