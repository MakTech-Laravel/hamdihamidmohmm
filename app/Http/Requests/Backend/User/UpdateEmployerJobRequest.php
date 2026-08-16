<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobPost;
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
            'salary_range' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
