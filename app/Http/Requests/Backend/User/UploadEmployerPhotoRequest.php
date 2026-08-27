<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadEmployerPhotoRequest extends FormRequest
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
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'photo.required' => 'Please choose a profile photo.',
            'photo.image' => 'The profile photo must be an image.',
            'photo.mimes' => 'The profile photo must be a JPG, PNG, or WEBP file.',
            'photo.max' => 'The profile photo may not be greater than 5MB.',
        ];
    }
}
