<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\OrganizationType;
use App\Support\SafeHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployerPublicAboutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'about' => SafeHtml::clean($this->input('about')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'organization_type' => ['required', Rule::enum(OrganizationType::class)],
            'industry' => ['nullable', 'string', 'max:255'],
            'about' => ['nullable', 'string', 'max:20000'],
            'website' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'company_name.required' => 'Please enter your organization name.',
            'organization_type.required' => 'Please select your organization type.',
            'organization_type.enum' => 'Please select a valid organization type.',
        ];
    }
}
