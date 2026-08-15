<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateEmployerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $this->user()?->canManageEmployers() === true
            && $target instanceof User
            && $target->isEmployer();
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
            'company_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($targetId),
            ],
            'industry' => ['nullable', 'string', 'max:255'],
            'package' => ['required', 'string', Rule::in(collect(EmployerPackage::cases())->map->value->all())],
            'account_status' => ['required', 'string', Rule::in(collect(EmployerAccountStatus::cases())->map->value->all())],
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'company_name.required' => 'Please enter the company name.',
            'contact_name.required' => 'Please enter the contact name.',
            'email.required' => 'Please enter the employer email.',
            'email.unique' => 'An account with this email already exists.',
            'package.required' => 'Please select a package.',
            'account_status.required' => 'Please select an account status.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
