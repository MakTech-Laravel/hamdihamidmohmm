<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobSeekerEmailPreferencesRequest extends FormRequest
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
            'application_status' => ['required', 'boolean'],
            'interview_invitations' => ['required', 'boolean'],
            'job_recommendations' => ['required', 'boolean'],
            'platform_announcements' => ['required', 'boolean'],
        ];
    }
}
