<?php

use App\Ai\Agents\AdminAssistant;
use App\Ai\Tools\GetPlatformOverview;
use App\Ai\Tools\SearchUsers;
use App\Enums\AiChatChannel;
use App\Models\AiChatLog;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Ai\AiChatService;
use Laravel\Ai\Prompts\AgentPrompt;

test('admins can review chatbot settings, usage stats and logs', function () {
    $admin = User::factory()->admin()->create();
    AiChatLog::factory()->count(2)->create(['input_tokens' => 100, 'output_tokens' => 50]);
    AiChatLog::factory()->admin()->fallback()->create(['input_tokens' => 10, 'output_tokens' => 5]);
    AiChatLog::factory()->failed()->create(['input_tokens' => 0, 'output_tokens' => 0]);

    $this->actingAs($admin)
        ->get(route('admin.ai-assistant.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AiAssistant')
            ->where('settings.public_chat_enabled', true)
            ->where('settings.admin_assistant_enabled', true)
            ->where('provider.name', config('ai.default'))
            ->where('stats.total', 4)
            ->where('stats.public', 3)
            ->where('stats.admin', 1)
            ->where('stats.answered', 2)
            ->where('stats.fallback', 1)
            ->where('stats.failed', 1)
            ->where('stats.tokens', 315)
            ->has('logs.data', 4));
});

test('admins can filter chatbot logs by channel and status', function () {
    $admin = User::factory()->admin()->create();
    AiChatLog::factory()->create(['question' => 'Public question']);
    AiChatLog::factory()->admin()->fallback()->create(['question' => 'Admin question']);

    $this->actingAs($admin)
        ->get(route('admin.ai-assistant.index', ['channel' => 'admin', 'status' => 'fallback']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.question', 'Admin question')
            ->where('filters.channel', 'admin')
            ->where('filters.status', 'fallback'));
});

test('admins can turn the chatbot and admin assistant on and off', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.ai-assistant.index'))
        ->put(route('admin.ai-assistant.settings.update'), [
            'public_chat_enabled' => false,
            'admin_assistant_enabled' => true,
        ])
        ->assertRedirect(route('admin.ai-assistant.index'))
        ->assertSessionHas('success');

    expect(PlatformSetting::aiAssistant())->toBe([
        'public_chat_enabled' => false,
        'admin_assistant_enabled' => true,
    ]);
});

test('chatbot settings require both switches', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.ai-assistant.settings.update'), ['public_chat_enabled' => 'maybe'])
        ->assertSessionHasErrors(['public_chat_enabled', 'admin_assistant_enabled']);
});

test('non admins cannot open the AI assistant admin page or use the admin assistant', function () {
    $employer = User::factory()->employer()->create();
    AdminAssistant::fake();

    $this->actingAs($employer)->get(route('admin.ai-assistant.index'))->assertRedirect();
    $this->actingAs($employer)
        ->postJson(route('admin.ai-assistant.messages.store'), ['message' => 'Show revenue'])
        ->assertStatus(302);

    AdminAssistant::assertNeverPrompted();
});

test('guests cannot use the admin assistant', function () {
    AdminAssistant::fake();

    $this->postJson(route('admin.ai-assistant.messages.store'), ['message' => 'Show revenue'])
        ->assertUnauthorized();

    AdminAssistant::assertNeverPrompted();
});

test('admins can ask the dashboard assistant questions', function () {
    $admin = User::factory()->admin()->create();
    AdminAssistant::fake(['There are 3 pending jobs. Review them in [Jobs](/admin/jobs?status=pending).']);

    $this->actingAs($admin)
        ->postJson(route('admin.ai-assistant.messages.store'), ['message' => 'How many jobs are pending?'])
        ->assertOk()
        ->assertJsonPath('fallback', false)
        ->assertJsonPath('reply', 'There are 3 pending jobs. Review them in [Jobs](/admin/jobs?status=pending).');

    AdminAssistant::assertPrompted(fn (AgentPrompt $prompt): bool => $prompt->prompt === 'How many jobs are pending?'
        && $prompt->agent->admin->is($admin));

    $log = AiChatLog::query()->sole();

    expect($log->channel)->toBe(AiChatChannel::Admin)
        ->and($log->user_id)->toBe($admin->id);

    $this->actingAs($admin)
        ->getJson(route('admin.ai-assistant.messages.index'))
        ->assertJsonCount(2, 'messages');

    $this->actingAs($admin)
        ->getJson(route('chatbot.messages.index'))
        ->assertJsonCount(0, 'messages');
});

test('the admin assistant is blocked when disabled', function () {
    $admin = User::factory()->admin()->create();
    PlatformSetting::query()->create([
        'key' => 'ai',
        'value' => ['public_chat_enabled' => true, 'admin_assistant_enabled' => false],
    ]);
    AdminAssistant::fake();

    $this->actingAs($admin)
        ->postJson(route('admin.ai-assistant.messages.store'), ['message' => 'Show revenue'])
        ->assertForbidden();

    AdminAssistant::assertNeverPrompted();
});

test('admins can clear the assistant conversation', function () {
    $admin = User::factory()->admin()->create();
    AdminAssistant::fake(['Done']);

    $this->actingAs($admin)->postJson(route('admin.ai-assistant.messages.store'), ['message' => 'Overview please'])->assertOk();
    $this->actingAs($admin)->deleteJson(route('admin.ai-assistant.messages.destroy'))->assertOk();
    $this->actingAs($admin)->getJson(route('admin.ai-assistant.messages.index'))->assertJsonCount(0, 'messages');
});

test('the admin assistant has read only dashboard tools and admin instructions', function () {
    $admin = User::factory()->admin()->create();
    $agent = new AdminAssistant($admin);
    $tools = collect($agent->tools());

    expect($tools->contains(fn (object $tool): bool => $tool instanceof GetPlatformOverview))->toBeTrue()
        ->and($tools->contains(fn (object $tool): bool => $tool instanceof SearchUsers))->toBeTrue()
        ->and((string) $agent->instructions())
        ->toContain('read-only')
        ->toContain('/admin/payments')
        ->toContain(AiChatService::SUPPORT_MARKER);
});
