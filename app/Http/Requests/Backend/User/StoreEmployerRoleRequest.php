<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\PermissionName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployerRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->isEmployerOwner() === true
            && $user->can(PermissionName::EmployerTeam->value);
    }

    protected function prepareForValidation(): void
    {
        $allowed = PermissionName::employerDelegatablePermissionValues();

        $permissions = collect($this->input('permissions', []))
            ->filter(fn ($permission): bool => is_string($permission) && in_array($permission, $allowed, true))
            ->unique()
            ->values()
            ->all();

        $this->merge(['permissions' => $permissions]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(PermissionName::employerDelegatablePermissionValues()),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'label.required' => 'Please enter a role name.',
        ];
    }
}
