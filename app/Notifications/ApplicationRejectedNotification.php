<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationRejectedNotification extends Notification
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

        return (new MailMessage)
            ->subject("Your application for {$this->jobTitle} was not selected")
            ->greeting($name !== '' ? "Hello {$name}," : 'Hello,')
            ->line("Your application for {$this->jobTitle} at {$this->companyName} was not selected.")
            ->action('View your applications', route('job-seeker.applications'))
            ->line("Thank you for using {$portal}.");
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Application status updated',
            'message' => "Your application for {$this->jobTitle} is now Rejected.",
            'category' => 'Application',
        ];
    }
}
