<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobPost;
use App\Support\SafeHtml;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployerJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('jobPost') ?? $this->route('job');

        return $this->user()?->isEmployer() === true
            && $job instanceof JobPost
            && $job->employer_id === $this->user()?->id;
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

        $payload = [
            'description' => SafeHtml::clean($this->input('description')),
        ];

        if ($this->exists('publish')) {
            $payload['publish'] = $this->boolean('publish');
        }

        $this->merge($payload);
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
