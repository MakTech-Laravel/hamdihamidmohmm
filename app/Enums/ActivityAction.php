<?php

namespace App\Enums;

enum ActivityAction: string
{
    case AccountCreated = 'account_created';
    case LoggedIn = 'logged_in';
    case ProfileUpdated = 'profile_updated';
    case RoleUpdated = 'role_updated';
    case PasswordUpdated = 'password_updated';
    case EmployerApproved = 'employer_approved';
    case EmployerRejected = 'employer_rejected';
    case JobSeekerSuspended = 'job_seeker_suspended';
    case JobSeekerReactivated = 'job_seeker_reactivated';
    case AccountDeleted = 'account_deleted';

    public function label(): string
    {
        return match ($this) {
            self::AccountCreated => 'Account created',
            self::LoggedIn => 'Signed in',
            self::ProfileUpdated => 'Profile updated',
            self::RoleUpdated => 'Role updated',
            self::PasswordUpdated => 'Password updated',
            self::EmployerApproved => 'Employer approved',
            self::EmployerRejected => 'Employer rejected',
            self::JobSeekerSuspended => 'Job seeker suspended',
            self::JobSeekerReactivated => 'Job seeker reactivated',
            self::AccountDeleted => 'Account deleted',
        };
    }
}
