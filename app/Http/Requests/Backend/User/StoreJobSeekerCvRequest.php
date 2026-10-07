<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobSeekerCvRequest extends FormRequest
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
            'resume' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'label' => ['nullable', 'string', 'max:120'],
            'make_default' => ['sometimes', 'boolean'],
            'extract_profile' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resume.required' => __('job_seeker.profile.resume_required'),
            'resume.mimes' => __('job_seeker.profile.resume_mimes'),
            'resume.max' => __('job_seeker.profile.resume_max'),
        ];
    }
}
