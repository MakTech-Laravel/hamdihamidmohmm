<?php

namespace App\Services\Ai;

use App\Ai\Agents\ChatTranslator;
use App\Enums\AiChatChannel;
use App\Enums\AiChatStatus;
use App\Enums\ChatLanguage;
use App\Models\AiChatLog;
use App\Models\PlatformSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Exceptions\FailoverableException;
use Throwable;

class AiChatService
{
    public const SUPPORT_MARKER = '[[SUPPORT]]';

    /**
     * @return list<array{role: string, content: string}>
     */
    public function history(Request $request, AiChatChannel $channel): array
    {
        $history = $request->session()->get($this->historyKey($channel), []);

        return is_array($history) ? array_values($history) : [];
    }

    public function clear(Request $request, AiChatChannel $channel): void
    {
        $request->session()->forget($this->historyKey($channel));
    }

    /**
     * Send the question to the agent built by the given factory and record the exchange.
     *
     * @param  Closure(list<array{role: string, content: string}>): Agent  $makeAgent
     * @return array{reply: string, fallback: bool, support: array<string, string>|null}
     */
    public function reply(Request $request, AiChatChannel $channel, string $question, Closure $makeAgent): array
    {
        $question = trim($question);
        $startedAt = hrtime(true);
        $inputTokens = 0;
        $outputTokens = 0;
        $error = null;

        try {
            $response = $this->withRetries(fn() => $makeAgent($this->history($request, $channel))->prompt($question));

            $text = trim((string) $response);
            $fallback = $text === '' || str_contains($text, self::SUPPORT_MARKER);
            $reply = trim(str_replace(self::SUPPORT_MARKER, '', $text));
            $status = $fallback ? AiChatStatus::Fallback : AiChatStatus::Answered;
            $inputTokens = $response->usage->promptTokens;
            $outputTokens = $response->usage->completionTokens;

            if ($reply === '') {
                $reply = __('chatbot.fallback_message');
            }
        } catch (Throwable $exception) {
            report($exception);

            $reply = __('chatbot.error_message');
            $fallback = true;
            $status = AiChatStatus::Failed;
            $error = $this->sanitizeError($exception);
        }

        AiChatLog::query()->create([
            'user_id' => $request->user()?->id,
            'channel' => $channel,
            'session_key' => $this->sessionKey($request),
            'locale' => app()->getLocale(),
            'question' => Str::limit($question, 2000),
            'answer' => $status === AiChatStatus::Failed ? null : $reply,
            'status' => $status,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'duration_ms' => (int) ((hrtime(true) - $startedAt) / 1_000_000),
            'error' => $error,
            'ip_address' => $request->ip(),
        ]);

        if ($status !== AiChatStatus::Failed) {
            $this->remember($request, $channel, $question, $reply);
        }

        return [
            'reply' => $reply,
            'fallback' => $fallback,
            'support' => $fallback ? $this->supportContacts() : null,
        ];
    }

    /**
     * Translate a chat message, returning null when the provider is unavailable.
     */
    public function translate(string $text, ChatLanguage $target): ?string
    {
        try {
            $translation = trim((string) $this->withRetries(fn() => (new ChatTranslator($target))->prompt($text)));
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }

        return $translation === '' ? null : $translation;
    }

    /**
     * @return array<string, string>
     */
    public function supportContacts(): array
    {
        return [
            ...array_filter(PlatformSetting::publicContact()),
            'contact_url' => route('contact', absolute: false),
        ];
    }

    /**
     * Retry briefly when the provider is overloaded, rate limited, or briefly unreachable.
     *
     * @template TResult
     *
     * @param  Closure(): TResult  $callback
     * @return TResult
     */
    private function withRetries(Closure $callback): mixed
    {
        return retry(
            max(1, (int) config('ai.chatbot.attempts', 3)),
            $callback,
            fn(int $attempt): int => min(4_000, $attempt * 900),
            fn(Throwable $exception): bool => $exception instanceof FailoverableException,
        );
    }

    /**
     * Keep admin logs useful without leaking secrets or huge provider payloads.
     */
    private function sanitizeError(Throwable $exception): string
    {
        $message = class_basename($exception) . ': ' . $exception->getMessage();
        $message = (string) preg_replace('/sk-[a-zA-Z0-9_\-]+/', 'sk-***', $message);
        $message = (string) preg_replace('/Bearer\s+\S+/i', 'Bearer ***', $message);

        return Str::limit($message, 250);
    }

    private function remember(Request $request, AiChatChannel $channel, string $question, string $reply): void
    {
        $limit = max(2, (int) config('ai.chatbot.history_messages', 12));

        $history = [
            ...$this->history($request, $channel),
            ['role' => 'user', 'content' => $question],
            ['role' => 'assistant', 'content' => $reply],
        ];

        $request->session()->put($this->historyKey($channel), array_slice($history, -$limit));
    }

    private function sessionKey(Request $request): string
    {
        $key = $request->session()->get('ai_chat.session_key');

        if (! is_string($key) || $key === '') {
            $key = hash('sha256', Str::uuid()->toString());
            $request->session()->put('ai_chat.session_key', $key);
        }

        return $key;
    }

    private function historyKey(AiChatChannel $channel): string
    {
        return "ai_chat.history.{$channel->value}";
    }
}
