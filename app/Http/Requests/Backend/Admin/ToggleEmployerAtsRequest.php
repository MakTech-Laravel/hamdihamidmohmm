<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ToggleEmployerAtsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageEmployers() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ats_enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ats_enabled.required' => 'Choose whether AI screening is enabled for this employer.',
        ];
    }
}
