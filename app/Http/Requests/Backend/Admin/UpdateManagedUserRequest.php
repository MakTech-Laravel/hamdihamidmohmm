<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\RoleName;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateManagedUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('user');

        if (! $actor?->canManageUsers() || ! $target instanceof User) {
            return false;
        }

        if ($target->isSuperAdmin() && ! $actor->canManageAdmins()) {
            return false;
        }

        return true;
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

        $allowedRoles = Role::query()->web()->pluck('name');

        if (! $this->user()?->canManageAdmins()) {
            $allowedRoles = $allowedRoles->reject(
                fn (string $name) => $name === RoleName::SuperAdmin->value,
            );
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($targetId),
            ],
            'company_name' => ['nullable', 'string', 'max:255'],
            'role' => ['required', 'string', Rule::in($allowedRoles->values()->all())],
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the user name.',
            'email.required' => 'Please enter the user email.',
            'email.unique' => 'An account with this email already exists.',
            'role.required' => 'Please select a role.',
            'role.in' => 'The selected role is not allowed.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
