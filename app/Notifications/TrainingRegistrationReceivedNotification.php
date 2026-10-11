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
        public string $statusLabel,
        public string $dates,
        public string $duration,
        public string $location,
        public string $trainer,
        public string $participantEmail,
        public string $participantPhone,
        public string $organization,
        public string $jobTitle,
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
            ->subject("New training registration: {$this->courseTitle}")
            ->view('mail.training.received', [
                'greeting' => $name !== '' ? "Hello {$name}," : 'Hello,',
                'participantName' => $this->participantName,
                'courseTitle' => $this->courseTitle,
                'statusLabel' => $this->statusLabel,
                'adminUrl' => $this->adminUrl,
                'details' => $this->details(),
            ]);
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
            'Participant' => $this->participantName,
            'Email' => $this->participantEmail,
            'Phone' => $this->participantPhone,
            'Organization' => $this->organization,
            'Job title' => $this->jobTitle,
        ], fn (string $value): bool => $value !== '');
    }
}
