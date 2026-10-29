<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ToggleAdminJobEmployerManageApplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageJobs() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'employer_can_manage_apply' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'employer_can_manage_apply.required' => 'Choose whether the employer can manage apply settings for this job.',
        ];
    }
}
