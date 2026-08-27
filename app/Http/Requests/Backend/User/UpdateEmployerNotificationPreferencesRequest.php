<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployerNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'new_applications' => ['required', 'boolean'],
            'job_expiry' => ['required', 'boolean'],
            'billing_alerts' => ['required', 'boolean'],
            'system_updates' => ['required', 'boolean'],
            'weekly_report' => ['required', 'boolean'],
        ];
    }
}
