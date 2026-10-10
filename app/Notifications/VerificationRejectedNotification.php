<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerificationRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
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
        $name = trim((string) ($notifiable->company_name ?? $notifiable->name ?? ''));
        $portal = (string) config('app.name');
        $mail = (new MailMessage)
            ->subject('Your company verification was rejected')
            ->greeting($name !== '' ? "Hello {$name}," : 'Hello,')
            ->line('Your company verification was rejected.');

        if (filled($this->reason)) {
            $mail->line('Reason: ' . $this->reason);
        }

        return $mail
            ->action('Contact us', route('contact'))
            ->line("Thank you for using {$portal}.");
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        $message = 'Your company verification was rejected.';

        if (filled($this->reason)) {
            $message .= ' Reason: ' . $this->reason;
        }

        return [
            'title' => 'Company verification rejected',
            'message' => $message,
            'category' => 'Verification',
        ];
    }
}
