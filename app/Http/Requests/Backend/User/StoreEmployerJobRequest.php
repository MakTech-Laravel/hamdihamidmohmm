<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

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
            'featured' => $this->boolean('featured'),
            'publish' => $this->boolean('publish', true),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'employment_type' => ['required', 'string', 'max:50'],
            'experience_level' => ['nullable', 'string', 'max:50'],
            'salary_range' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'requirements' => ['nullable', 'string'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:80'],
            'expires_at' => ['nullable', 'date'],
            'featured' => ['sometimes', 'boolean'],
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
            'employment_type.required' => 'Please choose a job type.',
        ];
    }
}
