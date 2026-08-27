<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployerPrivacyPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'profile_visibility' => ['required', 'string', Rule::in(['public', 'private'])],
            'show_salary' => ['required', 'boolean'],
            'show_contact_email' => ['required', 'boolean'],
        ];
    }
}
