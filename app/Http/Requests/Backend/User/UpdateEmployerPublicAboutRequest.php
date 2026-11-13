<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\JobTaxonomyType;
use App\Models\JobTaxonomy;
use App\Support\SafeHtml;
use Illuminate\Foundation\Http\FormRequest;

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
            'organization_type' => trim((string) $this->input('organization_type')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $currentOrganizationType = $this->user()?->organization_type;

        return [
            'company_name' => ['required', 'string', 'max:255'],
            'organization_type' => [
                'required',
                'string',
                'max:100',
                $this->organizationTypeOrCurrentRule(
                    is_string($currentOrganizationType) ? $currentOrganizationType : null,
                ),
            ],
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
        ];
    }

    private function organizationTypeOrCurrentRule(?string $current): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail) use ($current): void {
            $slug = is_string($value) ? trim($value) : '';

            if ($slug === '') {
                $fail('Please select a valid organization type.');

                return;
            }

            if ($current !== null && $slug === $current) {
                return;
            }

            if (JobTaxonomy::isValidSlug(JobTaxonomyType::OrganizationType, $slug)) {
                return;
            }

            $fail('Please select a valid organization type.');
        };
    }
}
