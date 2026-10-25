<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\PermissionName;
use App\Models\User;
use App\Support\EmployerAssignableRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployerTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $member = $this->route('member');

        return $user?->isEmployerOwner() === true
            && $user->can(PermissionName::EmployerTeam->value)
            && $member instanceof User
            && (int) $member->employer_owner_id === (int) $user->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $owner = $this->user();

        return [
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
            'role.required' => 'Please choose a role.',
            'role.in' => 'Please choose a valid team role.',
        ];
    }
}
