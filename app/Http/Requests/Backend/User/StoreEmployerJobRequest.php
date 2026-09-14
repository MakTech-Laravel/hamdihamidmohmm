<?php

namespace App\Http\Requests\Backend\User;

use App\Support\SafeHtml;
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
            'publish' => $this->boolean('publish', true),
            'description' => SafeHtml::clean($this->input('description')),
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
            'category' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'employment_type' => ['required', 'string', 'max:50'],
            'experience_level' => ['nullable', 'string', 'max:50'],
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
            'employment_type.required' => 'Please choose a job type.',
            'logo.image' => 'The job logo must be an image.',
            'logo.mimes' => 'The job logo must be a JPG, PNG, or WEBP file.',
            'logo.max' => 'The job logo may not be greater than 5MB.',
        ];
    }
}
