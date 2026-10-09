<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrainingRegistrationReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $registrationNumber,
        public string $courseTitle,
        public string $participantName,
        public string $adminUrl,
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

        return (new MailMessage)
            ->subject("New training registration {$this->registrationNumber}")
            ->greeting($name !== '' ? "Hello {$name}," : 'Hello,')
            ->line("{$this->participantName} registered for {$this->courseTitle}.")
            ->line("Registration number: {$this->registrationNumber}.")
            ->action('View registration', $this->adminUrl);
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New training registration',
            'message' => "{$this->participantName} registered for {$this->courseTitle}. Number {$this->registrationNumber}. {$this->adminUrl}",
            'category' => 'Training',
            'url' => $this->adminUrl,
            'registration_number' => $this->registrationNumber,
        ];
    }
}
