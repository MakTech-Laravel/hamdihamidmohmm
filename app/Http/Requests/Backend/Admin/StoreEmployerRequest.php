<?php

namespace App\Http\Requests\Backend\Admin;

use App\Concerns\PasswordValidationRules;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployerRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return $this->user()?->canManageEmployers() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:30'],
            'industry' => ['nullable', 'string', 'max:255'],
            'package' => ['required', 'string', Rule::in(collect(EmployerPackage::cases())->map->value->all())],
            'account_status' => ['required', 'string', Rule::in(collect(EmployerAccountStatus::cases())->map->value->all())],
            'password' => $this->passwordRules(),
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
            'password.required' => 'Please enter a password for the employer.',
        ];
    }
}
