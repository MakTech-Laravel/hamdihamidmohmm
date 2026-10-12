<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAiAssistantSettingsRequest extends FormRequest
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
            'public_chat_enabled' => ['required', 'boolean'],
            'admin_assistant_enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'public_chat_enabled.required' => 'Choose whether the website chatbot is enabled.',
            'admin_assistant_enabled.required' => 'Choose whether the admin assistant is enabled.',
        ];
    }
}
