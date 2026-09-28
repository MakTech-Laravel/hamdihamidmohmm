<?php

namespace App\Support;

use App\Enums\JobApplicationStatus;
use App\Enums\RoleName;
use App\Models\User;
use App\Notifications\ApplicationRejectedNotification;
use App\Notifications\ApplicationSubmittedNotification;
use App\Notifications\JobRejectedNotification;
use App\Notifications\PortalNotification;
use App\Notifications\VerificationRejectedNotification;

class PortalNotifier
{
    public static function send(User $user, string $title, string $message, string $category, ?string $preferenceKey = null): bool
    {
        if ($preferenceKey !== null && ! self::allows($user, $preferenceKey)) {
            return false;
        }

        $user->notify(new PortalNotification($title, $message, $category));

        return true;
    }

    public static function allows(User $user, string $preferenceKey): bool
    {
        $prefs = PortalPreferences::for($user);

        return match ($preferenceKey) {
            'new_applications' => (bool) $prefs['notifications']['new_applications'],
            'job_expiry' => (bool) $prefs['notifications']['job_expiry'],
            'billing_alerts' => (bool) $prefs['notifications']['billing_alerts'],
            'system_updates' => (bool) $prefs['notifications']['system_updates'],
            'weekly_report' => (bool) $prefs['notifications']['weekly_report'],
            'application_status' => (bool) $prefs['email_preferences']['application_status'],
            'interview_invitations' => (bool) $prefs['email_preferences']['interview_invitations'],
            'job_recommendations' => (bool) $prefs['email_preferences']['job_recommendations'],
            'platform_announcements' => (bool) $prefs['email_preferences']['platform_announcements'],
            default => true,
        };
    }

    public static function newApplication(User $employer, string $candidateName, string $jobTitle): void
    {
        self::send(
            $employer,
            'New application received',
            "{$candidateName} applied for {$jobTitle}.",
            'Application',
            'new_applications',
        );
    }

    public static function applicationSubmitted(User $seeker, string $jobTitle, string $companyName): void
    {
        $seeker->notify(new ApplicationSubmittedNotification($jobTitle, $companyName));
    }

    public static function applicationStatusChanged(
        User $seeker,
        string $jobTitle,
        JobApplicationStatus $status,
        ?string $companyName = null,
    ): void {
        if ($status === JobApplicationStatus::Rejected) {
            $seeker->notify(new ApplicationRejectedNotification(
                $jobTitle,
                filled($companyName) ? $companyName : 'the employer',
            ));

            return;
        }

        $preferenceKey = $status === JobApplicationStatus::Interview
            ? 'interview_invitations'
            : 'application_status';

        self::send(
            $seeker,
            'Application status updated',
            "Your application for {$jobTitle} is now {$status->label()}.",
            'Application',
            $preferenceKey,
        );
    }

    public static function verificationApproved(User $employer): void
    {
        self::send(
            $employer,
            'Company verification approved',
            'Your company verification has been approved. You can now post jobs.',
            'Verification',
        );
    }

    public static function verificationRejected(User $employer, ?string $reason = null): void
    {
        $employer->notify(new VerificationRejectedNotification($reason));
    }

    public static function jobApproved(User $employer, string $jobTitle): void
    {
        self::send(
            $employer,
            'Job listing approved',
            "Your job \"{$jobTitle}\" is now live.",
            'Job',
            'system_updates',
        );
    }

    public static function jobRejected(User $employer, string $jobTitle, ?string $reason = null): void
    {
        $employer->notify(new JobRejectedNotification($jobTitle, $reason));
    }

    public static function billingAlert(User $employer, string $title, string $message): void
    {
        self::send(
            $employer,
            $title,
            $message,
            'Billing',
            'billing_alerts',
        );
    }

    public static function employerRegistered(User $employer): void
    {
        $company = $employer->company_name ?: $employer->name;

        self::notifyAdmins(
            'New employer registration',
            "{$company} ({$employer->email}) registered and awaits verification approval.",
            'Verification',
        );
    }

    public static function notifyAdmins(string $title, string $message, string $category = 'System'): void
    {
        User::query()
            ->role(RoleName::adminPanelValues())
            ->each(fn(User $admin) => self::send($admin, $title, $message, $category));
    }
}
