<?php

namespace App\Http\Requests\Backend\Admin;

use App\Concerns\PasswordValidationRules;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobSeekerRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return $this->user()?->canManageJobSeekers() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:30'],
            'location' => ['nullable', 'string', 'max:255'],
            'resume_status' => ['required', 'string', Rule::in(collect(JobSeekerResumeStatus::cases())->map->value->all())],
            'account_status' => ['required', 'string', Rule::in(collect(JobSeekerAccountStatus::cases())->map->value->all())],
            'password' => $this->passwordRules(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the job seeker name.',
            'email.required' => 'Please enter the job seeker email.',
            'email.unique' => 'An account with this email already exists.',
            'resume_status.required' => 'Please select a resume status.',
            'account_status.required' => 'Please select an account status.',
            'password.required' => 'Please enter a password for the job seeker.',
        ];
    }
}
