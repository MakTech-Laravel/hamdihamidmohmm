<?php

namespace App\Http\Requests\Backend\User;

use App\Concerns\PasswordValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class DeleteEmployerAccountRequest extends FormRequest
{
    use PasswordValidationRules;

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
            'password' => $this->currentPasswordRules(),
        ];
    }
}
