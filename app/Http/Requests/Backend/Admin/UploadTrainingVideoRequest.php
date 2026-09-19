<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadTrainingVideoRequest extends FormRequest
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
            'video' => [
                'required',
                'file',
                'mimetypes:video/mp4,video/webm,video/quicktime',
                'mimes:mp4,webm,mov',
                'max:51200',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'video.required' => 'Please choose a video file.',
            'video.mimes' => 'The video must be an MP4, WebM, or MOV file.',
            'video.mimetypes' => 'The video must be an MP4, WebM, or MOV file.',
            'video.max' => 'The video may not be greater than 50 MB.',
        ];
    }
}
