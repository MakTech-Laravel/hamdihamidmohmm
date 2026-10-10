<?php

namespace App\Notifications;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PolicyUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $policyTitle,
        public string $policyUrl,
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
        $template = EmailTemplate::ensurePolicyUpdatedExists();
        $replacements = $this->replacements($notifiable);
        $body = $template->renderBody($replacements);

        $mail = (new MailMessage)
            ->subject($template->renderSubject($replacements))
            ->greeting('');

        foreach (preg_split("/\r\n|\n|\r/", $body) ?: [] as $line) {
            if (trim($line) === '') {
                $mail->line('');

                continue;
            }

            $mail->line($line);
        }

        return $mail;
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Policy updated',
            'message' => "Platform policy updated: {$this->policyTitle}",
            'category' => 'Policy',
            'url' => $this->policyUrl,
        ];
    }

    /**
     * @return array<string, string>
     */
    private function replacements(object $notifiable): array
    {
        return [
            'name' => trim((string) ($notifiable->name ?? '')) ?: 'there',
            'policy_title' => $this->policyTitle,
            'policy_url' => $this->policyUrl,
            'platform_name' => (string) config('app.name'),
        ];
    }
}
