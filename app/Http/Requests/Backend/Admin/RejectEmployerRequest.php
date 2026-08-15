<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RejectEmployerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $this->user()?->canManageEmployers() === true
            && $target instanceof User
            && $target->canApproveEmployer();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Please enter a reason for rejection.',
        ];
    }
}
