<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobPost;
use App\Support\EmployerJobAccess;
use Illuminate\Foundation\Http\FormRequest;

class UploadEmployerJobLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        $user = $this->user();

        return $user?->isEmployer() === true
            && $job instanceof JobPost
            && EmployerJobAccess::canAccessJob($user, $job);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'logo.required' => 'Please choose a job logo.',
            'logo.image' => 'The job logo must be an image.',
            'logo.mimes' => 'The job logo must be a JPG, PNG, or WEBP file.',
            'logo.max' => 'The job logo may not be greater than 5MB.',
        ];
    }
}
