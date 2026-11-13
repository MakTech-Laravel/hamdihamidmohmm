<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\JobTaxonomyType;
use App\Models\JobTaxonomy;
use App\Support\SafeHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
    }

    protected function prepareForValidation(): void
    {
        $year = $this->input('founded_year');

        if ($year === '' || $year === null) {
            $this->merge(['founded_year' => null]);
        }

        if ($this->exists('about')) {
            $this->merge([
                'about' => SafeHtml::clean($this->input('about')),
            ]);
        }

        $this->merge([
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
            'contact_name' => ['nullable', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'company_size' => ['nullable', 'string', 'max:50'],
            'founded_year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'website' => ['nullable', 'string', 'max:255'],
            'linkedin_url' => ['nullable', 'string', 'max:255'],
            'x_url' => ['nullable', 'string', 'max:255'],
            'instagram_url' => ['nullable', 'string', 'max:255'],
            'about' => ['nullable', 'string', 'max:20000'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()?->id)],
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
            'email.required' => 'Please enter a contact email.',
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
