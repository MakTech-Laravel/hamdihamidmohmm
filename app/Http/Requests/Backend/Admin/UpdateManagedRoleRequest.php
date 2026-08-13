<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\PermissionName;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateManagedRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');

        return $this->user()?->canManageAdmins() === true
            && $role instanceof Role
            && ! $role->isLocked();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(collect(PermissionName::cases())->map->value->all())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'label.required' => 'Please enter a role name.',
            'permissions.*.in' => 'One of the selected permissions is not allowed.',
        ];
    }
}
