<?php

namespace App\Http\Requests\Frontend;

use App\Enums\ChatLanguage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TranslateChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'text' => is_string($this->input('text')) ? trim($this->input('text')) : $this->input('text'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:4000'],
            'target' => ['required', Rule::in(ChatLanguage::translationTargets())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'text.required' => __('chatbot.validation.translate_required'),
            'text.max' => __('chatbot.validation.translate_max'),
            'target.required' => __('chatbot.validation.language'),
            'target.in' => __('chatbot.validation.language'),
        ];
    }

    public function targetLanguage(): ChatLanguage
    {
        return ChatLanguage::from((string) $this->validated('target'));
    }
}
