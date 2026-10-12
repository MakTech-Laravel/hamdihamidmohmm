<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Ai\Agents\AdminAssistant;
use App\Enums\AiChatChannel;
use App\Enums\AiChatStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateAiAssistantSettingsRequest;
use App\Http\Requests\Frontend\SendChatMessageRequest;
use App\Http\Requests\Frontend\TranslateChatMessageRequest;
use App\Models\AiChatLog;
use App\Models\PlatformSetting;
use App\Services\Ai\AiChatService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AiAssistantController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isAdmin() === true, 403);

        $channel = AiChatChannel::tryFrom($request->string('channel')->toString());
        $status = AiChatStatus::tryFrom($request->string('status')->toString());
        $search = trim($request->string('search')->toString());

        $logs = AiChatLog::query()
            ->with('user:id,name,email')
            ->when($channel, fn (Builder $query) => $query->where('channel', $channel))
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $inner) use ($search): void {
                $inner->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (AiChatLog $log): array => [
                'id' => $log->id,
                'channel' => $log->channel->value,
                'channel_label' => $log->channel->label(),
                'status' => $log->status->value,
                'status_label' => $log->status->label(),
                'question' => $log->question,
                'answer' => $log->answer,
                'error' => $log->error,
                'locale' => $log->locale,
                'user' => $log->user?->name ?? $log->user?->email,
                'tokens' => $log->input_tokens + $log->output_tokens,
                'duration_ms' => $log->duration_ms,
                'created_at' => $log->created_at?->diffForHumans(),
                'created_at_exact' => $log->created_at?->format('M j, Y g:i A'),
            ]);

        $provider = (string) config('ai.default');

        return Inertia::render('backend/Admin/AiAssistant', [
            'settings' => PlatformSetting::aiAssistant(),
            'canManageSettings' => $request->user()->canManageSettings(),
            'provider' => [
                'name' => $provider,
                'model' => config('ai.chatbot.model') ?: null,
                'configured' => filled(config("ai.providers.{$provider}.key")) || $provider === 'ollama',
            ],
            'stats' => $this->stats(),
            'logs' => $logs,
            'filters' => [
                'channel' => $channel?->value ?? '',
                'status' => $status?->value ?? '',
                'search' => $search,
            ],
        ]);
    }

    public function updateSettings(UpdateAiAssistantSettingsRequest $request): RedirectResponse
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => 'ai'],
            ['value' => [
                'public_chat_enabled' => $request->boolean('public_chat_enabled'),
                'admin_assistant_enabled' => $request->boolean('admin_assistant_enabled'),
            ]],
        );

        return back()->with('success', 'AI assistant settings saved.');
    }

    public function messages(Request $request, AiChatService $chat): JsonResponse
    {
        return response()->json([
            'enabled' => PlatformSetting::aiAssistant()['admin_assistant_enabled'],
            'messages' => $chat->history($request, AiChatChannel::Admin),
        ]);
    }

    public function send(SendChatMessageRequest $request, AiChatService $chat): JsonResponse
    {
        abort_unless(PlatformSetting::aiAssistant()['admin_assistant_enabled'], 403, __('chatbot.disabled'));

        $result = $chat->reply(
            $request,
            AiChatChannel::Admin,
            $request->validated('message'),
            fn (array $history): AdminAssistant => new AdminAssistant(
                $request->user(),
                $history,
                app()->getLocale(),
                $request->replyLanguage(),
            ),
        );

        return response()->json($result);
    }

    public function translate(TranslateChatMessageRequest $request, AiChatService $chat): JsonResponse
    {
        abort_unless(PlatformSetting::aiAssistant()['admin_assistant_enabled'], 403, __('chatbot.disabled'));

        $translation = $chat->translate($request->validated('text'), $request->targetLanguage());

        if ($translation === null) {
            return response()->json(['message' => __('chatbot.translate_failed')], 503);
        }

        return response()->json(['translation' => $translation, 'target' => $request->targetLanguage()->value]);
    }

    public function clear(Request $request, AiChatService $chat): JsonResponse
    {
        $chat->clear($request, AiChatChannel::Admin);

        return response()->json(['messages' => []]);
    }

    /**
     * @return array{total: int, public: int, admin: int, answered: int, fallback: int, failed: int, tokens: int, sessions: int}
     */
    private function stats(): array
    {
        $since = now()->subDays(30);

        $byStatus = AiChatLog::query()
            ->where('created_at', '>=', $since)
            ->toBase()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $byChannel = AiChatLog::query()
            ->where('created_at', '>=', $since)
            ->toBase()
            ->selectRaw('channel, COUNT(*) as aggregate')
            ->groupBy('channel')
            ->pluck('aggregate', 'channel');

        return [
            'total' => (int) $byStatus->sum(),
            'public' => (int) ($byChannel[AiChatChannel::Public->value] ?? 0),
            'admin' => (int) ($byChannel[AiChatChannel::Admin->value] ?? 0),
            'answered' => (int) ($byStatus[AiChatStatus::Answered->value] ?? 0),
            'fallback' => (int) ($byStatus[AiChatStatus::Fallback->value] ?? 0),
            'failed' => (int) ($byStatus[AiChatStatus::Failed->value] ?? 0),
            'tokens' => (int) AiChatLog::query()
                ->where('created_at', '>=', $since)
                ->toBase()
                ->selectRaw('COALESCE(SUM(input_tokens + output_tokens), 0) as tokens')
                ->value('tokens'),
            'sessions' => AiChatLog::query()->where('created_at', '>=', $since)->distinct()->count('session_key'),
        ];
    }
}
