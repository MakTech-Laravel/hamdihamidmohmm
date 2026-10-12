<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Models\Package;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListPricingPlans implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'List the employer subscription packages (pricing plans) currently offered on the portal, '
            .'with price, currency and included / excluded features.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $plans = collect(Package::publicCards())
            ->map(fn (array $plan): array => [
                'name' => Package::localizedLabel($plan['name']),
                'description' => Package::localizedLabel($plan['description']),
                'price' => $plan['price'],
                'currency' => $plan['currency'],
                'is_featured' => $plan['is_featured'],
                'included_features' => collect($plan['features'])
                    ->where('included', true)
                    ->map(fn (array $feature): ?string => Package::localizedLabel($feature['key']))
                    ->values()
                    ->all(),
                'excluded_features' => collect($plan['features'])
                    ->where('included', false)
                    ->map(fn (array $feature): ?string => Package::localizedLabel($feature['key']))
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        return $this->encode([
            'audience' => 'Packages are purchased by employers to post jobs. Job seekers use the portal for free.',
            'plans' => $plans,
            'pricing_url' => route('pricing', absolute: false),
            'employer_register_url' => route('register.role', 'employer', absolute: false),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
