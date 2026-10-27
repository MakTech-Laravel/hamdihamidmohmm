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
            fn(array $message): Message => new Message($message['role'], $message['content']),
            $this->history,
        );
    }

    /**
     * Prefer the configured default provider (openai / gemini / groq).
     */
    public function provider(): ?string
    {
        $provider = config('ai.default');

        return filled($provider) ? (string) $provider : null;
    }

    /**
     * Prefer AI_CHATBOT_MODEL; otherwise the provider's configured default text model is used.
     */
    public function model(): ?string
    {
        $model = config('ai.chatbot.model');

        return filled($model) ? (string) $model : null;
    }
}
