<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\TrainingRegistrationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrainingRegistrationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageCms() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::enum(TrainingRegistrationStatus::class)],
        ];
    }
}
