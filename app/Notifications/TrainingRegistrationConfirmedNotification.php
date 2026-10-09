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
        $portal = (string) config('app.name');

        return (new MailMessage)
            ->subject("Registration confirmed: {$this->registrationNumber}")
            ->greeting($name !== '' ? "Hello {$name}," : 'Hello,')
            ->line("Your registration for {$this->courseTitle} has been received.")
            ->line("Your registration number is {$this->registrationNumber}.")
            ->line("Thank you for using {$portal}.");
    }
}
