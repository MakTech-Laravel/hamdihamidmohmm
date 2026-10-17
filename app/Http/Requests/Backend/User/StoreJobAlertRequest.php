<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\JobTaxonomyType;
use App\Models\JobAlert;
use App\Models\JobTaxonomy;
use App\Support\JobAlertMatcher;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreJobAlertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isJobSeeker() === true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->nullableString('name'),
            'keyword' => $this->nullableString('keyword'),
            'country' => $this->nullableString('country'),
            'location' => $this->nullableString('location'),
            'category' => $this->nullableString('category'),
            'employment_type' => $this->nullableString('employment_type'),
            'is_active' => $this->boolean('is_active', true),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:120'],
            'keyword' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'employment_type' => ['nullable', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'criteria_required' => __('job_seeker.alerts.validation.criteria_required'),
            'country.in' => __('job_seeker.alerts.validation.invalid_filter'),
            'location.in' => __('job_seeker.alerts.validation.invalid_filter'),
            'category.in' => __('job_seeker.alerts.validation.invalid_filter'),
            'employment_type.in' => __('job_seeker.alerts.validation.invalid_filter'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $alert = new JobAlert($this->only([
                'keyword',
                'country',
                'location',
                'category',
                'employment_type',
            ]));

            if (! JobAlertMatcher::hasCriteria($alert)) {
                $validator->errors()->add('keyword', __('job_seeker.alerts.validation.criteria_required'));
            }

            $this->validateTaxonomy($validator, 'country', JobTaxonomyType::Country);
            $this->validateTaxonomy($validator, 'location', JobTaxonomyType::DutyStation);
            $this->validateTaxonomy($validator, 'category', JobTaxonomyType::PositionArea);
            $this->validateTaxonomy($validator, 'employment_type', JobTaxonomyType::EmploymentType);
        });
    }

    private function nullableString(string $key): ?string
    {
        $value = $this->input($key);

        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function validateTaxonomy(Validator $validator, string $field, JobTaxonomyType $type): void
    {
        $value = $this->input($field);

        if (! is_string($value) || $value === '') {
            return;
        }

        if (! JobTaxonomy::isValidSlug($type, $value)) {
            $validator->errors()->add($field, __('job_seeker.alerts.validation.invalid_filter'));
        }
    }
}
