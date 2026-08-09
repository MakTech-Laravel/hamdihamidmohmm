<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
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
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $profileRules = $this->baseProfileRules();
        unset($profileRules['password'], $profileRules['password_confirmation']);

        Validator::make($input, [
            ...$profileRules,
            'password' => $this->passwordRules(),
            'password_confirmation' => $this->profilePasswordConfirmationRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
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
