<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadEmployerCoverRequest extends FormRequest
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
            'cover' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cover.required' => 'Please choose a cover banner.',
            'cover.image' => 'The cover banner must be an image.',
            'cover.mimes' => 'The cover banner must be a JPG, PNG, or WEBP file.',
            'cover.max' => 'The cover banner may not be greater than 5MB.',
        ];
    }
}
