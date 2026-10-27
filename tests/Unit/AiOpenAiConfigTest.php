<?php

use App\Ai\Agents\ChatTranslator;
use App\Ai\Agents\SiteAssistant;
use App\Enums\ChatLanguage;
use Laravel\Ai\Ai;

test('openai provider uses public api model ids instead of package placeholders', function () {
    config([
        'ai.default' => 'openai',
        'ai.chatbot.model' => null,
        'ai.providers.openai.models.text.default' => 'gpt-4o-mini',
        'ai.providers.openai.models.text.cheapest' => 'gpt-4o-mini',
        'ai.providers.openai.models.text.smartest' => 'gpt-4o',
    ]);

    $provider = Ai::textProvider('openai');

    expect($provider->defaultTextModel())->toBe('gpt-4o-mini')
        ->and($provider->cheapestTextModel())->toBe('gpt-4o-mini')
        ->and($provider->smartestTextModel())->toBe('gpt-4o')
        ->and($provider->defaultTextModel())->not->toContain('gpt-5.6');
});

test('chatbot agents resolve the configured openai provider and model', function () {
    config([
        'ai.default' => 'openai',
        'ai.chatbot.model' => 'gpt-4o-mini',
    ]);

    $assistant = new SiteAssistant;
    $translator = new ChatTranslator(ChatLanguage::English);

    expect($assistant->provider())->toBe('openai')
        ->and($assistant->model())->toBe('gpt-4o-mini')
        ->and($translator->provider())->toBe('openai')
        ->and($translator->model())->toBe('gpt-4o-mini');
});
