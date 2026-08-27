<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UploadEmployerVerificationDocumentRequest extends FormRequest
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
            'document' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document.required' => 'Please upload a verification document.',
            'document.mimes' => 'The document must be a PDF, DOC, or DOCX file.',
            'document.max' => 'The document may not be greater than 5MB.',
        ];
    }
}
