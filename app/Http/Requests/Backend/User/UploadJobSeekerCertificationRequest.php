<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadJobSeekerCertificationRequest extends FormRequest
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
            'index' => ['required', 'integer', 'min:0'],
            'name' => ['nullable', 'string', 'max:255'],
            'issuer' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'string', 'max:50'],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'index.required' => __('job_seeker.profile.certification_index_required'),
            'document.required' => __('job_seeker.profile.certification_file_required'),
            'document.mimes' => __('job_seeker.profile.certification_file_mimes'),
            'document.max' => __('job_seeker.profile.certification_file_max'),
        ];
    }
}
