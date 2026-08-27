<?php

namespace App\Support;

use App\Models\User;

class PortalPreferences
{
    /**
     * @return array{
     *     notifications: array{
     *         new_applications: bool,
     *         job_expiry: bool,
     *         billing_alerts: bool,
     *         system_updates: bool,
     *         weekly_report: bool
     *     },
     *     privacy: array{
     *         profile_visibility: string,
     *         show_salary: bool,
     *         show_contact_email: bool
     *     },
     *     email_preferences: array{
     *         application_status: bool,
     *         interview_invitations: bool,
     *         job_recommendations: bool,
     *         platform_announcements: bool
     *     }
     * }
     */
    public static function defaults(): array
    {
        return [
            'notifications' => [
                'new_applications' => true,
                'job_expiry' => true,
                'billing_alerts' => true,
                'system_updates' => false,
                'weekly_report' => true,
            ],
            'privacy' => [
                'profile_visibility' => 'public',
                'show_salary' => true,
                'show_contact_email' => false,
            ],
            'email_preferences' => [
                'application_status' => true,
                'interview_invitations' => true,
                'job_recommendations' => true,
                'platform_announcements' => true,
            ],
        ];
    }

    /**
     * @return array{
     *     notifications: array{
     *         new_applications: bool,
     *         job_expiry: bool,
     *         billing_alerts: bool,
     *         system_updates: bool,
     *         weekly_report: bool
     *     },
     *     privacy: array{
     *         profile_visibility: string,
     *         show_salary: bool,
     *         show_contact_email: bool
     *     },
     *     email_preferences: array{
     *         application_status: bool,
     *         interview_invitations: bool,
     *         job_recommendations: bool,
     *         platform_announcements: bool
     *     }
     * }
     */
    public static function for(User $user): array
    {
        $stored = is_array($user->portal_preferences) ? $user->portal_preferences : [];

        return array_replace_recursive(self::defaults(), $stored);
    }

    /**
     * @param  array<string, mixed>  $notifications
     * @return array<string, mixed>
     */
    public static function mergeNotifications(User $user, array $notifications): array
    {
        $prefs = self::for($user);
        $prefs['notifications'] = array_merge($prefs['notifications'], [
            'new_applications' => (bool) ($notifications['new_applications'] ?? $prefs['notifications']['new_applications']),
            'job_expiry' => (bool) ($notifications['job_expiry'] ?? $prefs['notifications']['job_expiry']),
            'billing_alerts' => (bool) ($notifications['billing_alerts'] ?? $prefs['notifications']['billing_alerts']),
            'system_updates' => (bool) ($notifications['system_updates'] ?? $prefs['notifications']['system_updates']),
            'weekly_report' => (bool) ($notifications['weekly_report'] ?? $prefs['notifications']['weekly_report']),
        ]);

        return $prefs;
    }

    /**
     * @param  array<string, mixed>  $privacy
     * @return array<string, mixed>
     */
    public static function mergePrivacy(User $user, array $privacy): array
    {
        $prefs = self::for($user);
        $visibility = ($privacy['profile_visibility'] ?? $prefs['privacy']['profile_visibility']) === 'private'
            ? 'private'
            : 'public';

        $prefs['privacy'] = [
            'profile_visibility' => $visibility,
            'show_salary' => (bool) ($privacy['show_salary'] ?? $prefs['privacy']['show_salary']),
            'show_contact_email' => (bool) ($privacy['show_contact_email'] ?? $prefs['privacy']['show_contact_email']),
        ];

        return $prefs;
    }

    /**
     * @param  array<string, mixed>  $emailPreferences
     * @return array<string, mixed>
     */
    public static function mergeEmailPreferences(User $user, array $emailPreferences): array
    {
        $prefs = self::for($user);
        $prefs['email_preferences'] = [
            'application_status' => (bool) ($emailPreferences['application_status'] ?? $prefs['email_preferences']['application_status']),
            'interview_invitations' => (bool) ($emailPreferences['interview_invitations'] ?? $prefs['email_preferences']['interview_invitations']),
            'job_recommendations' => (bool) ($emailPreferences['job_recommendations'] ?? $prefs['email_preferences']['job_recommendations']),
            'platform_announcements' => (bool) ($emailPreferences['platform_announcements'] ?? $prefs['email_preferences']['platform_announcements']),
        ];

        return $prefs;
    }
}
