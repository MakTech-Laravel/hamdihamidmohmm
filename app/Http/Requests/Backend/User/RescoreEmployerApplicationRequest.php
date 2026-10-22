<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobApplication;
use App\Services\Ats\AtsSettings;
use Illuminate\Foundation\Http\FormRequest;

class RescoreEmployerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $application = $this->route('application');

        if (! $application instanceof JobApplication) {
            return false;
        }

        $application->loadMissing('jobPost');

        return $this->user()?->isEmployer() === true
            && $application->jobPost?->employer_id === $this->user()?->id
            && app(AtsSettings::class)->enabledForEmployer($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
