<?php

namespace App\Http\Requests\Backend\User;

use App\Models\JobPost;
use App\Models\User;
use App\Support\EmployerJobAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployerJobPanelMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $job = $this->route('job');

        if (! $user instanceof User || ! $job instanceof JobPost) {
            return false;
        }

        return EmployerJobAccess::canManagePanel($user)
            && (int) $job->employer_id === $user->employerAccountId();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $owner = $this->user();
        $job = $this->route('job');

        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) use ($owner): void {
                    $query->where('employer_owner_id', $owner?->id);
                }),
                Rule::unique('job_post_panel_members', 'user_id')->where(function ($query) use ($job): void {
                    if ($job instanceof JobPost) {
                        $query->where('job_post_id', $job->id);
                    }
                }),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'Please choose a panel member.',
            'user_id.exists' => 'Please choose a valid team member.',
            'user_id.unique' => 'That member is already on this job panel.',
        ];
    }
}
