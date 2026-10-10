<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobSeekerCvRequest extends FormRequest
{
    public function authorize(): bool
    {
        $cv = $this->route('cv');

        return $this->user()?->isJobSeeker() === true
            && $cv !== null
            && (int) $cv->user_id === (int) $this->user()?->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:120'],
            'make_default' => ['sometimes', 'boolean'],
        ];
    }
}
