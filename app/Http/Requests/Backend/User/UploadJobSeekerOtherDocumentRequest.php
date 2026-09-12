<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadJobSeekerOtherDocumentRequest extends FormRequest
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
            'other_document' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'other_document.required' => __('job_seeker.profile.other_document_required'),
            'other_document.mimes' => __('job_seeker.profile.other_document_mimes'),
            'other_document.max' => __('job_seeker.profile.other_document_max'),
        ];
    }
}
