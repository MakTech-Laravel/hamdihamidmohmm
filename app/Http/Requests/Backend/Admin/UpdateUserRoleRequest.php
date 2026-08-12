<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageUsers() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $allowedRoles = [
            UserRole::JobSeeker->value,
            UserRole::Employer->value,
            UserRole::Admin->value,
        ];

        if ($this->user()?->canManageAdmins()) {
            $allowedRoles[] = UserRole::SuperAdmin->value;
        }

        return [
            'role' => ['required', 'integer', Rule::in($allowedRoles)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required' => 'Please select a role.',
            'role.in' => 'The selected role is not allowed.',
        ];
    }
}
