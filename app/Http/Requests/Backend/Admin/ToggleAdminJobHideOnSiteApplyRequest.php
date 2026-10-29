<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ToggleAdminJobHideOnSiteApplyRequest extends FormRequest
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
            'hide_on_site_apply' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'hide_on_site_apply.required' => 'Choose whether Apply Now is hidden for this job.',
        ];
    }
}
