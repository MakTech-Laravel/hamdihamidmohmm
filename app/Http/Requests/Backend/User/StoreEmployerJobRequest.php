<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\JobTaxonomyType;
use App\Support\SafeHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployerJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
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
            'publish' => $this->boolean('publish', true),
            'description' => SafeHtml::clean($this->input('description')),
            'country' => $this->nullableSlug('country'),
            'location' => $this->nullableSlug('location'),
            'category' => $this->nullableSlug('category'),
            'employment_type' => trim((string) $this->input('employment_type')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'country' => [
                'nullable',
                'string',
                'max:100',
                Rule::exists('job_taxonomies', 'slug')->where(
                    fn ($query) => $query->where('type', JobTaxonomyType::Country->value)->where('is_active', true)
                ),
            ],
            'category' => [
                'required',
                'string',
                'max:100',
                Rule::exists('job_taxonomies', 'slug')->where(
                    fn ($query) => $query->where('type', JobTaxonomyType::PositionArea->value)->where('is_active', true)
                ),
            ],
            'location' => [
                'required',
                'string',
                'max:100',
                Rule::exists('job_taxonomies', 'slug')->where(
                    fn ($query) => $query->where('type', JobTaxonomyType::DutyStation->value)->where('is_active', true)
                ),
            ],
            'employment_type' => [
                'required',
                'string',
                'max:100',
                Rule::exists('job_taxonomies', 'slug')->where(
                    fn ($query) => $query->where('type', JobTaxonomyType::EmploymentType->value)->where('is_active', true)
                ),
            ],
            'experience_level' => ['required', 'string', 'max:50'],
            'salary_range' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:20000'],
            'requirements' => ['nullable', 'string'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:80'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'expires_at' => ['nullable', 'date'],
            'publish' => ['sometimes', 'boolean'],
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
            'category.exists' => 'Please choose a valid position area.',
            'location.required' => 'Please choose a duty station.',
            'location.exists' => 'Please choose a valid duty station.',
            'employment_type.required' => 'Please choose a job type.',
            'employment_type.exists' => 'Please choose a valid job type.',
            'experience_level.required' => 'Please choose an experience level.',
            'country.exists' => 'Please choose a valid country.',
            'logo.image' => 'The job logo must be an image.',
            'logo.mimes' => 'The job logo must be a JPG, PNG, or WEBP file.',
            'logo.max' => 'The job logo may not be greater than 5MB.',
        ];
    }

    private function nullableSlug(string $key): ?string
    {
        $value = trim((string) $this->input($key));

        return $value !== '' ? $value : null;
    }
}
