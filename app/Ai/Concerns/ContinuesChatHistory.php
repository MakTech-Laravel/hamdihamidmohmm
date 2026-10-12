<?php

namespace App\Ai\Concerns;

use Laravel\Ai\Messages\Message;

trait ContinuesChatHistory
{
    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return list<Message>
     */
    public function messages(): iterable
    {
        return array_map(
            fn (array $message): Message => new Message($message['role'], $message['content']),
            $this->history,
        );
    }

    public function model(): ?string
    {
        $model = config('ai.chatbot.model');

        return filled($model) ? (string) $model : null;
    }
}
