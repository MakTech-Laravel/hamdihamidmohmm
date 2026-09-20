<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobSeekerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isJobSeeker() === true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['skills', 'availability'] as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $this->merge([
                    $field => collect(preg_split('/[\n,]+/', $value) ?: [])
                        ->map(fn(string $item): string => trim($item))
                        ->filter()
                        ->values()
                        ->all(),
                ]);
            }
        }

        foreach (['education', 'experience', 'languages', 'certifications'] as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $decoded = json_decode($value, true);
                $this->merge([
                    $field => is_array($decoded) ? $decoded : [],
                ]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'location' => ['nullable', 'string', 'max:255'],
            'headline' => ['nullable', 'string', 'max:255'],
            'current_title' => ['nullable', 'string', 'max:255'],
            'experience_years' => ['nullable', 'string', 'max:50'],
            'bio' => ['nullable', 'string'],
            'linkedin_url' => ['nullable', 'string', 'max:255'],
            'github_url' => ['nullable', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'expected_salary' => ['nullable', 'string', 'max:255'],
            'availability' => ['nullable', 'array'],
            'availability.*' => ['string', 'max:80'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:100'],
            'education' => ['nullable', 'array'],
            'experience' => ['nullable', 'array'],
            'languages' => ['nullable', 'array'],
            'certifications' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your full name.',
            'phone.required' => 'Please enter your phone number.',
        ];
    }
}
