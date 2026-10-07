<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\ActivityAction;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Enums\OrganizationType;
use App\Enums\UserRole;
use App\Models\User;
use App\Support\ActivityLogger;
use App\Support\PortalNotifier;
use App\Support\RoleAssigner;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules {
        PasswordValidationRules::passwordRules insteadof ProfileValidationRules;
        PasswordValidationRules::passwordRules as fortifyPasswordRules;
        ProfileValidationRules::passwordRules as profilePasswordRules;
        ProfileValidationRules::profileRules as baseProfileRules;
        ProfileValidationRules::passwordConfirmationRules as profilePasswordConfirmationRules;
    }

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $role = (int) ($input['role'] ?? UserRole::JobSeeker->value);
        $isEmployer = $role === UserRole::Employer->value;

        Validator::make($input, [
            'name' => $isEmployer ? ['nullable', 'string', 'max:255'] : $this->nameRules(),
            'email' => $this->emailRules(),
            'phone' => ['required', 'string', 'max:30'],
            'password' => $this->passwordRules(),
            'password_confirmation' => $this->profilePasswordConfirmationRules(),
            'role' => ['required', 'integer', Rule::in(UserRole::registrableValues())],
            'company_name' => [$isEmployer ? 'required' : 'nullable', 'string', 'max:255'],
            'organization_type' => ['nullable', Rule::enum(OrganizationType::class)],
            'terms' => ['accepted'],
        ], [
            'role.required' => 'Please select whether you are a job seeker or an employer.',
            'role.in' => 'Please select a valid account type.',
            'company_name.required' => 'Please enter your company or organization name.',
            'organization_type.enum' => 'Please select a valid organization type.',
            'phone.required' => 'Please enter your phone number.',
            'terms.accepted' => 'You must agree to the Terms & Conditions and Privacy Policy.',
        ])->validate();

        $displayName = $isEmployer
            ? (string) $input['company_name']
            : (string) $input['name'];

        $organizationType = null;

        if ($isEmployer) {
            $organizationType = filled($input['organization_type'] ?? null)
                ? OrganizationType::from((string) $input['organization_type'])
                : OrganizationType::PrivateCompany;
        }

        $user = User::create([
            'name' => $displayName,
            'company_name' => $isEmployer ? $displayName : null,
            'organization_type' => $organizationType,
            'contact_name' => $isEmployer ? $displayName : null,
            'email' => $input['email'],
            'phone' => $input['phone'],
            'password' => $input['password'],
            'role' => UserRole::from($role),
            'verification_status' => $isEmployer ? EmployerVerificationStatus::Pending : null,
            'account_status' => $isEmployer ? EmployerAccountStatus::PendingVerification : JobSeekerAccountStatus::Active,
            'resume_status' => $isEmployer ? null : JobSeekerResumeStatus::Warning,
            'package' => $isEmployer ? EmployerPackage::Starter : null,
        ]);

        $user = RoleAssigner::assign($user, UserRole::from($role));

        ActivityLogger::log(
            $user,
            ActivityAction::AccountCreated,
            'Account registered.',
            $user,
        );

        if ($isEmployer) {
            PortalNotifier::employerRegistered($user);
        }

        return $user;
    }

    /**
     * Use Fortify's stronger password defaults for registration.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return $this->fortifyPasswordRules();
    }
}
