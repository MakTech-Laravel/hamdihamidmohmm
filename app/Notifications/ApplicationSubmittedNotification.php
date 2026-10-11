<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $jobTitle,
        public string $companyName,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim((string) ($notifiable->name ?? ''));
        $portal = (string) config('app.name');

        $applicationsUrl = url('/job-seeker/applications');

        return (new MailMessage)
            ->subject("Your application for {$this->jobTitle} was submitted")
            ->greeting($name !== '' ? "Dear {$name}," : 'Dear Applicant,')
            ->line("Thank you for applying through {$portal} for the position of {$this->jobTitle} at {$this->companyName}. We confirm receipt of your application.")
            ->line('After the vacancy closes, all applications will be reviewed. Only shortlisted candidates will be contacted for the assessment phase, which typically includes a technical assessment and a competency-based interview, though this may vary by role.')
            ->line('If you’re shortlisted and require assistance or reasonable accommodation during the assessment, please notify our HR team when you receive the invitation.')
            ->line("Follow your [application status]({$applicationsUrl}) on the {$portal} Careers portal.")
            ->salutation("Best regards,\n{$portal} Talent Acquisition");
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Application submitted',
            'message' => "Your application for {$this->jobTitle} at {$this->companyName} was submitted successfully.",
            'category' => 'Application',
        ];
    }
}
