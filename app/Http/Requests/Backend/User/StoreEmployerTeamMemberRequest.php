<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\PermissionName;
use App\Support\EmployerAssignableRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreEmployerTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->isEmployerOwner() === true
            && $user->can(PermissionName::EmployerTeam->value);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $owner = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => [
                'required',
                'string',
                Rule::in($owner ? EmployerAssignableRoles::names($owner) : []),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the team member name.',
            'email.required' => 'Please enter an email address.',
            'email.unique' => 'That email is already registered.',
            'password.required' => 'Please choose a password.',
            'role.required' => 'Please choose a role.',
            'role.in' => 'Please choose a valid team role.',
        ];
    }
}
