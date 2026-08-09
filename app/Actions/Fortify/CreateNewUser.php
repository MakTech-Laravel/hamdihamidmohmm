<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserRole;
use App\Models\User;
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
            'password' => $this->passwordRules(),
            'password_confirmation' => $this->profilePasswordConfirmationRules(),
            'role' => ['required', 'integer', Rule::in(UserRole::registrableValues())],
            'company_name' => [$isEmployer ? 'required' : 'nullable', 'string', 'max:255'],
            'terms' => ['accepted'],
        ], [
            'role.required' => 'Please select whether you are a job seeker or an employer.',
            'role.in' => 'Please select a valid account type.',
            'company_name.required' => 'Please enter your company or organization name.',
            'terms.accepted' => 'You must agree to the Terms & Conditions and Privacy Policy.',
        ])->validate();

        $displayName = $isEmployer
            ? (string) $input['company_name']
            : (string) $input['name'];

        return User::create([
            'name' => $displayName,
            'company_name' => $isEmployer ? $displayName : null,
            'email' => $input['email'],
            'password' => $input['password'],
            'role' => UserRole::from($role),
        ]);
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
