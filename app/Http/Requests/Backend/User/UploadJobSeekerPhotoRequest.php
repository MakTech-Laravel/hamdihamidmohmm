<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadJobSeekerPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isJobSeeker() === true;
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
            'photo.required' => __('job_seeker.profile.photo_required'),
            'photo.image' => __('job_seeker.profile.photo_image'),
            'photo.mimes' => __('job_seeker.profile.photo_mimes'),
            'photo.max' => __('job_seeker.profile.photo_max'),
        ];
    }
}
