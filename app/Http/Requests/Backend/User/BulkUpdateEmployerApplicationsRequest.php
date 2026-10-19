<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\JobApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateEmployerApplicationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
            'status' => ['required', 'string', Rule::in(collect(JobApplicationStatus::cases())->map->value->all())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Select at least one candidate.',
            'status.required' => 'Please choose an application status.',
            'status.in' => 'Please choose a valid application status.',
        ];
    }
}
