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

        return (new MailMessage)
            ->subject("Your application for {$this->jobTitle} was submitted")
            ->greeting($name !== '' ? "Hello {$name}," : 'Hello,')
            ->line("Your application for {$this->jobTitle} at {$this->companyName} has been submitted successfully.")
            ->action('View your applications', url('/job-seeker/applications'))
            ->line("Thank you for using {$portal}.");
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
