<?php

namespace App\Http\Controllers\Frontend;

use App\Ai\Agents\SiteAssistant;
use App\Enums\AiChatChannel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Frontend\SendChatMessageRequest;
use App\Http\Requests\Frontend\TranslateChatMessageRequest;
use App\Models\PlatformSetting;
use App\Services\Ai\AiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatbotController extends Controller
{
    public function index(Request $request, AiChatService $chat): JsonResponse
    {
        return response()->json([
            'enabled' => PlatformSetting::aiAssistant()['public_chat_enabled'],
            'messages' => $chat->history($request, AiChatChannel::Public),
        ]);
    }

    public function store(SendChatMessageRequest $request, AiChatService $chat): JsonResponse
    {
        abort_unless(PlatformSetting::aiAssistant()['public_chat_enabled'], 403, __('chatbot.disabled'));

        $result = $chat->reply(
            $request,
            AiChatChannel::Public,
            $request->validated('message'),
            fn (array $history): SiteAssistant => new SiteAssistant(
                $history,
                $request->user(),
                app()->getLocale(),
                $request->replyLanguage(),
            ),
        );

        return response()->json($result);
    }

    public function translate(TranslateChatMessageRequest $request, AiChatService $chat): JsonResponse
    {
        abort_unless(PlatformSetting::aiAssistant()['public_chat_enabled'], 403, __('chatbot.disabled'));

        $translation = $chat->translate($request->validated('text'), $request->targetLanguage());

        if ($translation === null) {
            return response()->json(['message' => __('chatbot.translate_failed')], 503);
        }

        return response()->json(['translation' => $translation, 'target' => $request->targetLanguage()->value]);
    }

    public function destroy(Request $request, AiChatService $chat): JsonResponse
    {
        $chat->clear($request, AiChatChannel::Public);

        return response()->json(['messages' => []]);
    }
}
