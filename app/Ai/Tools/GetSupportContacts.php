<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Models\PlatformSetting;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetSupportContacts implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get the official support phone numbers, emails, office address and contact form link.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        return $this->encode([
            ...array_filter(PlatformSetting::publicContact()),
            'contact_form_url' => route('contact', absolute: false),
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
