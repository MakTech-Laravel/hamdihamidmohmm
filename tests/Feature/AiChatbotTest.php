<?php

use App\Ai\Agents\SiteAssistant;
use App\Ai\Tools\GetMyApplications;
use App\Enums\AiChatChannel;
use App\Enums\AiChatStatus;
use App\Models\AiChatLog;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Ai\AiChatService;
use Laravel\Ai\Prompts\AgentPrompt;

test('guests can chat with the website assistant and the exchange is logged', function () {
    SiteAssistant::fake(['You can search jobs on the [Jobs](/) page.']);

    $this->postJson(route('chatbot.messages.store'), ['message' => 'How do I find jobs?'])
        ->assertOk()
        ->assertJson([
            'reply' => 'You can search jobs on the [Jobs](/) page.',
            'fallback' => false,
            'support' => null,
        ]);

    SiteAssistant::assertPrompted('How do I find jobs?');

    $log = AiChatLog::query()->sole();

    expect($log->channel)->toBe(AiChatChannel::Public)
        ->and($log->status)->toBe(AiChatStatus::Answered)
        ->and($log->user_id)->toBeNull()
        ->and($log->question)->toBe('How do I find jobs?')
        ->and($log->session_key)->toHaveLength(64);

    $this->getJson(route('chatbot.messages.index'))
        ->assertOk()
        ->assertJson([
            'enabled' => true,
            'messages' => [
                ['role' => 'user', 'content' => 'How do I find jobs?'],
                ['role' => 'assistant', 'content' => 'You can search jobs on the [Jobs](/) page.'],
            ],
        ]);
});

test('previous messages in the session are sent to the assistant as conversation history', function () {
    SiteAssistant::fake(['First answer', 'Second answer']);

    $this->postJson(route('chatbot.messages.store'), ['message' => 'First question'])->assertOk();
    $this->postJson(route('chatbot.messages.store'), ['message' => 'Second question'])->assertOk();

    SiteAssistant::assertPrompted(fn (AgentPrompt $prompt): bool => $prompt->prompt === 'Second question'
        && $prompt->agent->history === [
            ['role' => 'user', 'content' => 'First question'],
            ['role' => 'assistant', 'content' => 'First answer'],
        ]);
});

test('chat history is capped to the configured number of messages', function () {
    config(['ai.chatbot.history_messages' => 4]);
    SiteAssistant::fake(['A1', 'A2', 'A3']);

    foreach (['Q1', 'Q2', 'Q3'] as $question) {
        $this->postJson(route('chatbot.messages.store'), ['message' => $question])->assertOk();
    }

    $this->getJson(route('chatbot.messages.index'))
        ->assertJsonCount(4, 'messages')
        ->assertJsonPath('messages.0.content', 'Q2');
});

test('uncertain answers fall back to support contacts', function () {
    PlatformSetting::query()->create([
        'key' => 'general',
        'value' => ['support_email' => 'help@example.com', 'support_phone' => '+249 900 000 000'],
    ]);

    SiteAssistant::fake(['I am not sure about refunds for your account. '.AiChatService::SUPPORT_MARKER]);

    $this->postJson(route('chatbot.messages.store'), ['message' => 'Can I get a refund?'])
        ->assertOk()
        ->assertJson([
            'reply' => 'I am not sure about refunds for your account.',
            'fallback' => true,
            'support' => [
                'support_email' => 'help@example.com',
                'support_phone' => '+249 900 000 000',
                'contact_url' => '/contact',
            ],
        ]);

    expect(AiChatLog::query()->sole()->status)->toBe(AiChatStatus::Fallback);
});

test('provider failures return a friendly message with support details and are logged', function () {
    SiteAssistant::fake(fn () => throw new RuntimeException('Provider unavailable'));

    $this->postJson(route('chatbot.messages.store'), ['message' => 'Hello there'])
        ->assertOk()
        ->assertJsonPath('fallback', true)
        ->assertJsonPath('reply', __('chatbot.error_message'))
        ->assertJsonPath('support.contact_url', '/contact');

    $log = AiChatLog::query()->sole();

    expect($log->status)->toBe(AiChatStatus::Failed)
        ->and($log->answer)->toBeNull()
        ->and($log->error)->toContain('Provider unavailable');

    $this->getJson(route('chatbot.messages.index'))->assertJsonCount(0, 'messages');
});

test('the chatbot replies are blocked when the admin disables it', function () {
    PlatformSetting::query()->create([
        'key' => 'ai',
        'value' => ['public_chat_enabled' => false, 'admin_assistant_enabled' => true],
    ]);

    SiteAssistant::fake();

    $this->postJson(route('chatbot.messages.store'), ['message' => 'Hello there'])->assertForbidden();
    $this->getJson(route('chatbot.messages.index'))->assertJsonPath('enabled', false);

    SiteAssistant::assertNeverPrompted();
    expect(AiChatLog::query()->count())->toBe(0);
});

test('chat messages are validated', function (mixed $message) {
    SiteAssistant::fake();

    $this->postJson(route('chatbot.messages.store'), ['message' => $message])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('message');

    SiteAssistant::assertNeverPrompted();
})->with([
    'missing' => [null],
    'blank' => ['   '],
    'too short' => ['a'],
    'too long' => [str_repeat('a', 1001)],
]);

test('the public chatbot is rate limited', function () {
    config(['ai.chatbot.public_per_minute' => 2]);
    SiteAssistant::fake(['One', 'Two', 'Three']);

    $this->postJson(route('chatbot.messages.store'), ['message' => 'Question one'])->assertOk();
    $this->postJson(route('chatbot.messages.store'), ['message' => 'Question two'])->assertOk();
    $this->postJson(route('chatbot.messages.store'), ['message' => 'Question three'])
        ->assertTooManyRequests()
        ->assertJsonPath('message', __('chatbot.rate_limited'));

    SiteAssistant::assertPromptedTimes(2);
});

test('visitors can clear their chat history', function () {
    SiteAssistant::fake(['Answer']);

    $this->postJson(route('chatbot.messages.store'), ['message' => 'Question'])->assertOk();
    $this->deleteJson(route('chatbot.messages.destroy'))->assertOk()->assertJson(['messages' => []]);
    $this->getJson(route('chatbot.messages.index'))->assertJsonCount(0, 'messages');
});

test('signed in job seekers can ask about their own applications', function () {
    $jobSeeker = User::factory()->jobSeeker()->create();
    SiteAssistant::fake(['You have no applications yet.']);

    $this->actingAs($jobSeeker)
        ->postJson(route('chatbot.messages.store'), ['message' => 'What is the status of my applications?'])
        ->assertOk();

    SiteAssistant::assertPrompted(fn (AgentPrompt $prompt): bool => $prompt->agent->user?->is($jobSeeker) === true
        && collect($prompt->agent->tools())->contains(fn (object $tool): bool => $tool instanceof GetMyApplications));

    expect(AiChatLog::query()->sole()->user_id)->toBe($jobSeeker->id);
});

test('guests and employers do not get the personal applications tool', function (?string $role) {
    $user = $role === null ? null : User::factory()->{$role}()->create();

    $tools = collect((new SiteAssistant([], $user))->tools());

    expect($tools->contains(fn (object $tool): bool => $tool instanceof GetMyApplications))->toBeFalse()
        ->and($tools)->toHaveCount(4);
})->with([
    'guest' => [null],
    'employer' => ['employer'],
]);

test('the site assistant instructions cover the portal and the support fallback', function () {
    $instructions = (string) (new SiteAssistant([], null, 'ar'))->instructions();

    expect($instructions)
        ->toContain(AiChatService::SUPPORT_MARKER)
        ->toContain('/register/job-seeker')
        ->toContain('/pricing')
        ->toContain('PDF, DOC or DOCX')
        ->toContain('reply in Arabic');
});

test('the chatbot availability is shared with the frontend', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('ai_chat.public_chat_enabled', true)
            ->where('ai_chat.admin_assistant_enabled', true));
});
