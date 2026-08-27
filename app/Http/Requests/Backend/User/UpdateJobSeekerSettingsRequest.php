<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobSeekerSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isJobSeeker() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'timezone' => ['nullable', 'string', Rule::in([
                'Asia/Riyadh',
                'Asia/Dubai',
                'UTC',
            ])],
        ];
    }
}
