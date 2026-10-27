<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$k = (string) config('ai.providers.openai.key');
echo 'provider=' . config('ai.default') . PHP_EOL;
echo 'chatbot_model=' . var_export(config('ai.chatbot.model'), true) . PHP_EOL;
echo 'openai_default=' . config('ai.providers.openai.models.text.default') . PHP_EOL;
echo 'key_len=' . strlen($k) . PHP_EOL;
echo 'key_prefix=' . substr($k, 0, 7) . PHP_EOL;
echo 'store=' . var_export(config('ai.providers.openai.store'), true) . PHP_EOL;

$provider = Laravel\Ai\Ai::textProvider('openai');
echo 'resolved_default=' . $provider->defaultTextModel() . PHP_EOL;

$assistant = new App\Ai\Agents\SiteAssistant(
    [],
    null,
    'en',
    App\Enums\ChatLanguage::Auto,
);
echo 'agent_provider=' . $assistant->provider() . PHP_EOL;
echo 'agent_model=' . var_export($assistant->model(), true) . PHP_EOL;

try {
    $response = $assistant->prompt('Reply with the single word: OK');
    echo 'reply=' . trim((string) $response) . PHP_EOL;
} catch (Throwable $e) {
    echo 'exception=' . $e::class . PHP_EOL;
    echo 'message=' . $e->getMessage() . PHP_EOL;
}
