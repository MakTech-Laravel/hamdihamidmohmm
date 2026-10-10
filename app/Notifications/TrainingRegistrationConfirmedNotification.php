<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrainingRegistrationConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $registrationNumber,
        public string $courseTitle,
        public string $participantName,
        public string $statusLabel,
        public string $dates,
        public string $duration,
        public string $location,
        public string $trainer,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim($this->participantName);

        return (new MailMessage)
            ->subject("Training registration received: {$this->courseTitle}")
            ->view('mail.training.confirmed', [
                'greeting' => $name !== '' ? "Hello {$name}," : 'Hello,',
                'courseTitle' => $this->courseTitle,
                'statusLabel' => $this->statusLabel,
                'details' => $this->details(),
            ]);
    }

    /**
     * @return array<string, string>
     */
    private function details(): array
    {
        return array_filter([
            'Training' => $this->courseTitle,
            'Status' => $this->statusLabel,
            'Registration number' => $this->registrationNumber,
            'Dates' => $this->dates,
            'Duration' => $this->duration,
            'Location' => $this->location,
            'Trainer' => $this->trainer,
        ], fn (string $value): bool => $value !== '');
    }
}
