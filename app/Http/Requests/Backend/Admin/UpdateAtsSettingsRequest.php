<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAtsSettingsRequest extends FormRequest
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
            'enabled' => ['required', 'boolean'],
            'ai_enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'enabled.required' => 'Choose whether ATS screening is enabled.',
            'ai_enabled.required' => 'Choose whether AI providers may be used for ATS screening.',
        ];
    }
}
