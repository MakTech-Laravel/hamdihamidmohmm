<?php

namespace App\Http\Requests\Backend\User;

use App\Enums\PermissionName;
use App\Models\JobApplication;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployerRosterEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->isEmployer() === true
            && $user->can(PermissionName::EmployerApplications->value);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $accountId = $this->user()?->employerAccountId();

        return [
            'application_id' => [
                'required',
                'integer',
                Rule::exists('job_applications', 'id')->where(function ($query) use ($accountId): void {
                    $query->whereIn('job_post_id', function ($sub) use ($accountId): void {
                        $sub->select('id')
                            ->from('job_posts')
                            ->where('employer_id', $accountId);
                    });
                }),
            ],
            'category' => ['required', 'string', 'max:100'],
            'comments' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'application_id.required' => 'Please choose an application.',
            'application_id.exists' => 'That application is not available on your account.',
            'category.required' => 'Please enter or choose a category.',
            'category.max' => 'Category may not be longer than 100 characters.',
            'comments.max' => 'Comments may not be longer than 2000 characters.',
        ];
    }

    public function application(): JobApplication
    {
        return JobApplication::query()
            ->with(['jobPost', 'jobSeeker'])
            ->findOrFail($this->integer('application_id'));
    }
}
