<?php

namespace App\Http\Requests\Frontend;

use App\Enums\ChatLanguage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'message' => is_string($this->input('message')) ? trim($this->input('message')) : $this->input('message'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:2', 'max:1000'],
            'language' => ['nullable', Rule::enum(ChatLanguage::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required' => __('chatbot.validation.required'),
            'message.min' => __('chatbot.validation.min'),
            'message.max' => __('chatbot.validation.max'),
            'language.enum' => __('chatbot.validation.language'),
        ];
    }

    public function replyLanguage(): ChatLanguage
    {
        return ChatLanguage::tryFrom((string) $this->validated('language')) ?? ChatLanguage::Auto;
    }
}
