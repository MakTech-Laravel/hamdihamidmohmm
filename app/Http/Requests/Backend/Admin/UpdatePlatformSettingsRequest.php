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
            'group' => ['required', 'string', 'in:general,email,security,language,social,payments'],
            'values' => ['required', 'array'],
            'values.facebook_url' => ['nullable', 'string', 'max:500'],
            'values.twitter_url' => ['nullable', 'string', 'max:500'],
            'values.linkedin_url' => ['nullable', 'string', 'max:500'],
            'values.instagram_url' => ['nullable', 'string', 'max:500'],
            'values.bank_name' => ['nullable', 'string', 'max:255'],
            'values.bank_account_name' => ['nullable', 'string', 'max:255'],
            'values.bank_account_number' => ['nullable', 'string', 'max:255'],
            'values.bank_iban' => ['nullable', 'string', 'max:255'],
            'values.bank_instructions' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
