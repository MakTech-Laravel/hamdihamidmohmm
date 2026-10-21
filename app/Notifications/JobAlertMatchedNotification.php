<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobAlertMatchedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $jobTitle,
        public string $companyName,
        public string $jobSlug,
        public string $alertName,
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
        $jobUrl = url('/jobs/'.$this->jobSlug);

        return (new MailMessage)
            ->subject("New job match: {$this->jobTitle}")
            ->greeting($name !== '' ? "Dear {$name}," : 'Dear Applicant,')
            ->line("A new vacancy matching your job alert \"{$this->alertName}\" is now live on {$portal}.")
            ->line("**{$this->jobTitle}** at {$this->companyName}")
            ->action('View job', $jobUrl)
            ->line('You can manage your alerts anytime from your job seeker portal.')
            ->salutation("Best regards,\n{$portal}");
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New job matches your alert',
            'message' => "{$this->jobTitle} at {$this->companyName} matches \"{$this->alertName}\".",
            'category' => 'Job',
            'url' => '/jobs/'.$this->jobSlug,
        ];
    }
}
