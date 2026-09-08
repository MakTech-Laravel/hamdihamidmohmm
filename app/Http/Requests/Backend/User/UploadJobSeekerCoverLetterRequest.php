<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadJobSeekerCoverLetterRequest extends FormRequest
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
            'cover_letter' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cover_letter.required' => __('job_seeker.profile.cover_letter_required'),
            'cover_letter.mimes' => __('job_seeker.profile.cover_letter_mimes'),
            'cover_letter.max' => __('job_seeker.profile.cover_letter_max'),
        ];
    }
}
