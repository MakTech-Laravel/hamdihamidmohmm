<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\PermissionName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManagedRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageAdmins() === true;
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
