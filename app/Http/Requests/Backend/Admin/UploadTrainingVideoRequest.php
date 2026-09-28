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
        $videoRules = [
            'file',
            'mimetypes:video/mp4,video/webm,video/quicktime',
            'mimes:mp4,webm,mov',
            'max:51200',
        ];

        return [
            'video' => ['required_without:videos', 'nullable', ...$videoRules],
            'videos' => ['required_without:video', 'array', 'min:1', 'max:8'],
            'videos.*' => $videoRules,
            'name' => ['nullable', 'string', 'max:160'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'video.required_without' => 'Please choose at least one video file.',
            'videos.required_without' => 'Please choose at least one video file.',
            'video.mimes' => 'Each video must be an MP4, WebM, or MOV file.',
            'video.mimetypes' => 'Each video must be an MP4, WebM, or MOV file.',
            'video.max' => 'Each video may not be greater than 50 MB.',
            'videos.*.mimes' => 'Each video must be an MP4, WebM, or MOV file.',
            'videos.*.mimetypes' => 'Each video must be an MP4, WebM, or MOV file.',
            'videos.*.max' => 'Each video may not be greater than 50 MB.',
        ];
    }
}
