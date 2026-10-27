<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Support\EmployerJobAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $application = $this->route('application');
        $user = $this->user();

        if (! $application instanceof JobApplication || $user === null) {
            return false;
        }

        $application->loadMissing('jobPost');

        return $user->isEmployer()
            && $application->jobPost instanceof JobPost
            && EmployerJobAccess::canAccessJob($user, $application->jobPost);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(collect(JobApplicationStatus::cases())->map->value->all())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Please choose an application status.',
            'status.in' => 'Please choose a valid application status.',
        ];
    }
}
