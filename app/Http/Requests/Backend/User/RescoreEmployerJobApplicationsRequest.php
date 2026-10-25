<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobPost;
use App\Services\Ats\AtsSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RescoreEmployerJobApplicationsRequest extends FormRequest
{
    public const MODES = ['all', 'unscored', 'failed', 'rules'];

    public function authorize(): bool
    {
        $job = $this->route('job');

        if (! $job instanceof JobPost) {
            return false;
        }

        return $this->user()?->isEmployer() === true
            && $job->employer_id === $this->user()?->employerAccountId()
            && app(AtsSettings::class)->enabledForEmployer($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(self::MODES)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mode.required' => 'Please choose which applications to re-score.',
            'mode.in' => 'Please choose a valid re-score option.',
        ];
    }
}
