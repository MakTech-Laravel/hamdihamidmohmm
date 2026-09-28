<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $jobTitle,
        public ?string $reason = null,
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
        $mail = (new MailMessage)
            ->subject("Your job listing \"{$this->jobTitle}\" was rejected")
            ->greeting($name !== '' ? "Hello {$name}," : 'Hello,')
            ->line("Your job listing \"{$this->jobTitle}\" was rejected.");

        if (filled($this->reason)) {
            $mail->line('Reason: ' . $this->reason);
        }

        return $mail
            ->action('View your jobs', route('employer.jobs'))
            ->line("Thank you for using {$portal}.");
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        $message = "Your job \"{$this->jobTitle}\" was rejected.";

        if (filled($this->reason)) {
            $message .= ' Reason: ' . $this->reason;
        }

        return [
            'title' => 'Job listing rejected',
            'message' => $message,
            'category' => 'Job',
        ];
    }
}
