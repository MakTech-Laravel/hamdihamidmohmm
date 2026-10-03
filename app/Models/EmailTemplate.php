<?php

namespace App\Models;

use Database\Factories\EmailTemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    /** @use HasFactory<EmailTemplateFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'name',
        'subject',
        'body',
    ];

    /**
     * @return array{key: string, name: string, subject: string, body: string}
     */
    public static function policyUpdatedDefaults(): array
    {
        return [
            'key' => 'policy_updated',
            'name' => 'Policy Updated',
            'subject' => 'Important update: {{policy_title}}',
            'body' => "Hello {{name}},\n\nWe have updated our platform policy: {{policy_title}}.\n\nPlease review the changes here: {{policy_url}}\n\nThank you,\n{{platform_name}}",
        ];
    }

    public static function ensurePolicyUpdatedExists(): self
    {
        $defaults = self::policyUpdatedDefaults();

        return self::query()->firstOrCreate(
            ['key' => $defaults['key']],
            $defaults,
        );
    }

    /**
     * @param  array<string, string>  $replacements
     */
    public function renderSubject(array $replacements): string
    {
        return self::replacePlaceholders($this->subject, $replacements);
    }

    /**
     * @param  array<string, string>  $replacements
     */
    public function renderBody(array $replacements): string
    {
        return self::replacePlaceholders($this->body, $replacements);
    }

    /**
     * @param  array<string, string>  $replacements
     */
    public static function replacePlaceholders(string $text, array $replacements): string
    {
        foreach ($replacements as $key => $value) {
            $text = str_replace('{{' . $key . '}}', $value, $text);
        }

        return $text;
    }
}
