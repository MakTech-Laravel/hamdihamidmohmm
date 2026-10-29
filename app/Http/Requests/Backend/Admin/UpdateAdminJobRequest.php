<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\JobPostStatus;
use App\Enums\JobTaxonomyType;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use App\Support\ExternalApplyDestination;
use App\Support\SafeHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageJobs() === true;
    }

    protected function prepareForValidation(): void
    {
        $skills = $this->input('skills');

        if (is_string($skills)) {
            $this->merge([
                'skills' => collect(explode(',', $skills))
                    ->map(fn (string $skill): string => trim($skill))
                    ->filter()
                    ->values()
                    ->all(),
            ]);
        }

        $this->merge([
            'description' => SafeHtml::clean($this->input('description')),
            'requirements' => SafeHtml::clean($this->input('requirements')),
            'country' => $this->nullableSlug('country'),
            'location' => $this->nullableSlug('location'),
            'category' => $this->nullableSlug('category'),
            'employment_type' => trim((string) $this->input('employment_type')),
            'career_portal_url' => ExternalApplyDestination::prepare($this->input('career_portal_url')),
            'apply_by_link' => $this->boolean('apply_by_link'),
            'hide_on_site_apply' => $this->boolean('hide_on_site_apply'),
            'employer_can_manage_apply' => $this->boolean('employer_can_manage_apply'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $job = $this->route('jobPost');
        $currentCategory = $job instanceof JobPost ? $job->category : null;
        $currentLocation = $job instanceof JobPost ? $job->location : null;
        $currentCountry = $job instanceof JobPost ? $job->country : null;
        $currentEmploymentType = $job instanceof JobPost ? $job->employment_type : null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'country' => [
                'nullable',
                'string',
                'max:100',
                $this->taxonomyOrCurrentRule(JobTaxonomyType::Country, $currentCountry, nullable: true),
            ],
            'category' => [
                'required',
                'string',
                'max:100',
                $this->taxonomyOrCurrentRule(JobTaxonomyType::PositionArea, $currentCategory),
            ],
            'location' => [
                'required',
                'string',
                'max:100',
                $this->taxonomyOrCurrentRule(JobTaxonomyType::DutyStation, $currentLocation),
            ],
            'employment_type' => [
                'required',
                'string',
                'max:100',
                $this->taxonomyOrCurrentRule(JobTaxonomyType::EmploymentType, $currentEmploymentType),
            ],
            'experience_level' => ['required', 'string', 'max:50'],
            'salary_range' => ['nullable', 'string', 'max:255'],
            'career_portal_url' => ExternalApplyDestination::rules(),
            'apply_by_link' => ['sometimes', 'boolean'],
            'hide_on_site_apply' => ['sometimes', 'boolean'],
            'employer_can_manage_apply' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:20000'],
            'requirements' => ['nullable', 'string', 'max:20000'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:80'],
            'expires_at' => ['nullable', 'date'],
            'status' => ['required', 'string', Rule::in(collect(JobPostStatus::cases())->map->value->all())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Please enter a job title.',
            'category.required' => 'Please choose a position area.',
            'location.required' => 'Please choose a duty station.',
            'employment_type.required' => 'Please choose a job type.',
            'experience_level.required' => 'Please choose an experience level.',
            'status.required' => 'Please choose a job status.',
            ...ExternalApplyDestination::messages(),
        ];
    }

    private function taxonomyOrCurrentRule(
        JobTaxonomyType $type,
        ?string $current,
        bool $nullable = false,
    ): \Closure {
        return function (string $attribute, mixed $value, \Closure $fail) use ($type, $current, $nullable): void {
            if ($nullable && ($value === null || $value === '')) {
                return;
            }

            $slug = is_string($value) ? trim($value) : '';

            if ($slug === '') {
                $fail("Please choose a valid {$attribute}.");

                return;
            }

            if ($current !== null && $slug === $current) {
                return;
            }

            if (JobTaxonomy::isValidSlug($type, $slug)) {
                return;
            }

            $fail("Please choose a valid {$attribute}.");
        };
    }

    private function nullableSlug(string $key): ?string
    {
        $value = trim((string) $this->input($key));

        return $value !== '' ? $value : null;
    }
}
