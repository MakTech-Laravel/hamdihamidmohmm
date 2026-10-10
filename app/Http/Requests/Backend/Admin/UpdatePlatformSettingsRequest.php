<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageSettings() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'group' => ['required', 'string', 'in:general,email,security,language,social,payments,experience_filters,email_templates'],
            'values' => ['required', 'array'],
            'values.platform_name' => ['nullable', 'string', 'max:255'],
            'values.support_phone' => ['nullable', 'string', 'max:50'],
            'values.support_phone_secondary' => ['nullable', 'string', 'max:50'],
            'values.support_email' => ['nullable', 'email', 'max:255'],
            'values.contact_email' => ['nullable', 'email', 'max:255'],
            'values.company_address' => ['nullable', 'string', 'max:500'],
            'values.website_url' => ['nullable', 'string', 'max:500'],
            'values.facebook_url' => ['nullable', 'string', 'max:500'],
            'values.twitter_url' => ['nullable', 'string', 'max:500'],
            'values.linkedin_url' => ['nullable', 'string', 'max:500'],
            'values.instagram_url' => ['nullable', 'string', 'max:500'],
            'values.bank_name' => ['nullable', 'string', 'max:255'],
            'values.bank_account_name' => ['nullable', 'string', 'max:255'],
            'values.bank_account_number' => ['nullable', 'string', 'max:255'],
            'values.bank_iban' => ['nullable', 'string', 'max:255'],
            'values.bank_instructions' => ['nullable', 'string', 'max:2000'],
            'values.ranges' => ['nullable', 'array'],
            'values.ranges.*.key' => ['required_with:values.ranges', 'string', 'max:50'],
            'values.ranges.*.label' => ['required_with:values.ranges', 'string', 'max:100'],
            'values.ranges.*.min' => ['nullable', 'integer', 'min:0', 'max:100'],
            'values.ranges.*.max' => ['nullable', 'integer', 'min:0', 'max:100'],
            'values.ranges.*.enabled' => ['nullable', 'boolean'],
            'values.subject' => ['nullable', 'string', 'max:255'],
            'values.body' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
