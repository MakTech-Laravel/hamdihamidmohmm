<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateJobSeekerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $this->user()?->canManageJobSeekers() === true
            && $target instanceof User
            && $target->isJobSeeker();
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('password') === '') {
            $this->merge([
                'password' => null,
                'password_confirmation' => null,
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $target = $this->route('user');
        $targetId = $target instanceof User ? $target->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($targetId),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'location' => ['nullable', 'string', 'max:255'],
            'resume_status' => ['required', 'string', Rule::in(collect(JobSeekerResumeStatus::cases())->map->value->all())],
            'account_status' => ['required', 'string', Rule::in(collect(JobSeekerAccountStatus::cases())->map->value->all())],
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
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
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
