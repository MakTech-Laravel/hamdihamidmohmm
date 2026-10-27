<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Services\Ats\AtsSettings;
use App\Support\EmployerJobAccess;
use Illuminate\Foundation\Http\FormRequest;

class RescoreEmployerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $application = $this->route('application');
        $user = $this->user();

        if (! $application instanceof JobApplication || $user === null) {
            return false;
        }

        $application->loadMissing('jobPost');

        return $user->isEmployer()
            && $application->jobPost instanceof JobPost
            && EmployerJobAccess::canAccessJob($user, $application->jobPost)
            && app(AtsSettings::class)->enabledForEmployer($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
