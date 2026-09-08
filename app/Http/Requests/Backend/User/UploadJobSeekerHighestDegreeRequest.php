<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadJobSeekerHighestDegreeRequest extends FormRequest
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
            'highest_degree' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'highest_degree.required' => __('job_seeker.profile.highest_degree_required'),
            'highest_degree.mimes' => __('job_seeker.profile.highest_degree_mimes'),
            'highest_degree.max' => __('job_seeker.profile.highest_degree_max'),
        ];
    }
}
