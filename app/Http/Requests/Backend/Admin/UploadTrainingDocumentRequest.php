<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadTrainingDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageCms() === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'document' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt',
                'max:20480',
            ],
            'name' => ['nullable', 'string', 'max:160'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document.required' => 'Please choose a document file.',
            'document.mimes' => 'The document must be a PDF, Word, Excel, PowerPoint, or text file.',
            'document.max' => 'The document may not be greater than 20 MB.',
        ];
    }
}
