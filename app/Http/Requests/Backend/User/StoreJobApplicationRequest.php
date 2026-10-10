<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobSeekerCv;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobApplicationRequest extends FormRequest
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
        $cvCount = $this->user()
            ? JobSeekerCv::query()->where('user_id', $this->user()->id)->count()
            : 0;

        return [
            'cover_letter' => ['nullable', 'string', 'max:5000'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'cv_id' => [
                Rule::requiredIf($cvCount > 1 && ! $this->hasFile('resume')),
                'nullable',
                'integer',
                Rule::exists('job_seeker_cvs', 'id')->where('user_id', $this->user()?->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cover_letter.max' => 'The cover letter may not be greater than 5000 characters.',
            'resume.mimes' => 'Please upload a PDF, DOC, or DOCX resume.',
            'resume.max' => 'The resume may not be larger than 5MB.',
            'cv_id.required' => __('job_detail.cv_required'),
            'cv_id.exists' => __('job_detail.cv_invalid'),
        ];
    }
}
