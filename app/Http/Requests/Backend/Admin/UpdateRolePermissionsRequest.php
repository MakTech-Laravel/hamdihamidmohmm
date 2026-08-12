<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRolePermissionsRequest extends FormRequest
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
            'role' => ['required', 'string', Rule::in([
                RoleName::SuperAdmin->value,
                RoleName::Admin->value,
            ])],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', Rule::in(collect(PermissionName::cases())->map->value->all())],
        ];
    }
}
