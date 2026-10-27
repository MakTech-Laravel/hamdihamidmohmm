<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobPost;
use App\Services\Ats\AtsSettings;
use App\Support\EmployerJobAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RescoreEmployerJobApplicationsRequest extends FormRequest
{
    public const MODES = ['all', 'unscored', 'failed', 'rules'];

    public function authorize(): bool
    {
        $job = $this->route('job');
        $user = $this->user();

        if (! $job instanceof JobPost || $user === null) {
            return false;
        }

        return $user->isEmployer()
            && EmployerJobAccess::canAccessJob($user, $job)
            && app(AtsSettings::class)->enabledForEmployer($user);
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
