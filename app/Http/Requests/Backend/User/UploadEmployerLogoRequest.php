<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadEmployerLogoRequest extends FormRequest
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
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'logo.required' => 'Please choose a company logo.',
            'logo.image' => 'The logo must be an image.',
            'logo.mimes' => 'The logo must be a JPG, PNG, or WEBP file.',
            'logo.max' => 'The logo may not be greater than 5MB.',
        ];
    }
}
