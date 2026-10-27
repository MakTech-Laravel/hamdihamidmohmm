<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider Names
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the AI providers below should be the
    | default for AI operations when no explicit provider is provided
    | for the operation. This should be any provider defined below.
    |
    */

    'default' => env('AI_PROVIDER', 'openai'),
    'default_for_images' => 'gemini',
    'default_for_audio' => 'openai',
    'default_for_transcription' => 'openai',
    'default_for_embeddings' => 'openai',
    'default_for_reranking' => 'cohere',

    /*
    |--------------------------------------------------------------------------
    | Website Chatbot & Admin Assistant
    |--------------------------------------------------------------------------
    |
    | Settings for the public website / job seeker chatbot and the admin
    | dashboard assistant. Leave the model empty to use the provider's
    | default text model.
    |
    */

    'chatbot' => [
        // Prefer an explicit model. Empty = provider default from providers.*.models below.
        'model' => env('AI_CHATBOT_MODEL'),
        'history_messages' => (int) env('AI_CHATBOT_HISTORY_MESSAGES', 12),
        'public_per_minute' => (int) env('AI_CHATBOT_PUBLIC_PER_MINUTE', 8),
        'public_per_day' => (int) env('AI_CHATBOT_PUBLIC_PER_DAY', 120),
        'admin_per_minute' => (int) env('AI_CHATBOT_ADMIN_PER_MINUTE', 20),
        'attempts' => (int) env('AI_CHATBOT_ATTEMPTS', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | ATS Application Screening
    |--------------------------------------------------------------------------
    |
    | Scores each job application (0-100) against the job requirements using
    | the CV attached to that application. "providers" is a comma separated
    | failover list of "provider" or "provider:model" entries, e.g.
    | "openai:gpt-4o-mini,gemini". When every AI provider fails, the
    | rule-based scorer is used instead. Bulk runs are split into queue
    | batches of at most 1000 applications.
    |
    */

    'ats' => [
        'enabled' => (bool) env('AI_ATS_ENABLED', true),
        'ai_enabled' => (bool) env('AI_ATS_AI_ENABLED', true),
        'providers' => env('AI_ATS_PROVIDERS', ''),
        'model' => env('AI_ATS_MODEL'),
        'attempts' => (int) env('AI_ATS_ATTEMPTS', 2),
        'timeout' => (int) env('AI_ATS_TIMEOUT', 45),
        'max_cv_chars' => (int) env('AI_ATS_MAX_CV_CHARS', 15000),
        'min_text_chars' => 200,
        'batch_size' => (int) env('AI_ATS_BATCH_SIZE', 1000),
        'per_minute' => (int) env('AI_ATS_PER_MINUTE', 60),
        'queue' => env('AI_ATS_QUEUE', 'ats'),
        'shortlist_size' => (int) env('AI_ATS_SHORTLIST_SIZE', 5),
        'stale_after_minutes' => (int) env('AI_ATS_STALE_AFTER_MINUTES', 30),
        'daily_token_budget' => (int) env('AI_ATS_DAILY_TOKEN_BUDGET', 0),
        'retry_ai_within_hours' => 48,
        'max_ai_attempts' => 3,
        'weights' => [
            'skills' => 50,
            'experience' => 30,
            'education' => 20,
        ],
        'thresholds' => [
            'strong' => 75,
            'possible' => 50,
        ],
        'experience_levels' => [
            'entry' => ['min' => 0, 'max' => 2],
            'junior' => ['min' => 0, 'max' => 2],
            'mid' => ['min' => 3, 'max' => 5],
            'senior' => ['min' => 6, 'max' => null],
            'lead' => ['min' => 8, 'max' => null],
            'manager' => ['min' => 8, 'max' => null],
            'executive' => ['min' => 10, 'max' => null],
        ],
        'skill_synonyms' => [
            'javascript' => ['js', 'ecmascript'],
            'typescript' => ['ts'],
            'node.js' => ['node', 'nodejs'],
            'react' => ['reactjs', 'react.js'],
            'vue' => ['vuejs', 'vue.js'],
            'postgresql' => ['postgres'],
            'kubernetes' => ['k8s'],
            'microsoft excel' => ['excel', 'ms excel'],
            'microsoft office' => ['ms office', 'office 365'],
            'human resources' => ['hr'],
            'customer service' => ['customer support'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Caching
    |--------------------------------------------------------------------------
    |
    | Below you may configure caching strategies for AI related operations
    | such as embedding generation. You are free to adjust these values
    | based on your application's available caching stores and needs.
    |
    */

    'caching' => [
        'embeddings' => [
            'cache' => false,
            'store' => env('CACHE_STORE', 'database'),
            'individually' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Providers
    |--------------------------------------------------------------------------
    |
    | Below are each of your AI providers defined for this application. Each
    | represents an AI provider and API key combination which can be used
    | to perform tasks like text, image, and audio creation via agents.
    |
    */

    'providers' => [
        'anthropic' => [
            'driver' => 'anthropic',
            'key' => env('ANTHROPIC_API_KEY'),
            'url' => env('ANTHROPIC_URL', 'https://api.anthropic.com/v1'),
        ],

        'azure' => [
            'driver' => 'azure',
            'key' => env('AZURE_OPENAI_API_KEY'),
            'url' => env('AZURE_OPENAI_URL'),
            'api_version' => env('AZURE_OPENAI_API_VERSION', '2025-04-01-preview'),
            'deployment' => env('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o'),
            'embedding_deployment' => env('AZURE_OPENAI_EMBEDDING_DEPLOYMENT', 'text-embedding-3-small'),
            'image_deployment' => env('AZURE_OPENAI_IMAGE_DEPLOYMENT', 'gpt-image-1'),
            'store' => env('AZURE_OPENAI_STORE', true),
        ],

        'bedrock' => [
            'driver' => 'bedrock',
            'region' => env('AWS_BEDROCK_REGION', 'us-east-1'),
            'key' => env('AWS_BEARER_TOKEN_BEDROCK'),
            'access_key_id' => env('AWS_ACCESS_KEY_ID'),
            'secret_access_key' => env('AWS_SECRET_ACCESS_KEY'),
            'session_token' => env('AWS_SESSION_TOKEN'),
            'use_default_credential_provider' => env('AWS_USE_DEFAULT_CREDENTIALS', true),
            'assume_role' => [
                'arn' => env('AWS_BEDROCK_ASSUME_ROLE_ARN'),
                'session_name' => env('AWS_BEDROCK_ASSUME_ROLE_SESSION_NAME'),
                'duration_seconds' => env('AWS_BEDROCK_ASSUME_ROLE_DURATION_SECONDS'),
                'external_id' => env('AWS_BEDROCK_ASSUME_ROLE_EXTERNAL_ID'),
            ],
        ],

        'cohere' => [
            'driver' => 'cohere',
            'key' => env('COHERE_API_KEY'),
        ],

        'deepseek' => [
            'driver' => 'deepseek',
            'key' => env('DEEPSEEK_API_KEY'),
        ],

        'eleven' => [
            'driver' => 'eleven',
            'key' => env('ELEVENLABS_API_KEY'),
        ],

        'gemini' => [
            'driver' => 'gemini',
            'key' => env('GEMINI_API_KEY'),
            'url' => env('GEMINI_URL', 'https://generativelanguage.googleapis.com/v1beta/'),
            'models' => [
                'text' => [
                    'default' => env('GEMINI_TEXT_MODEL', 'gemini-2.0-flash'),
                    'cheapest' => env('GEMINI_TEXT_MODEL_CHEAPEST', 'gemini-2.0-flash-lite'),
                    'smartest' => env('GEMINI_TEXT_MODEL_SMARTEST', 'gemini-2.0-flash'),
                ],
            ],
        ],

        'groq' => [
            'driver' => 'groq',
            'key' => env('GROQ_API_KEY'),
            'models' => [
                'text' => [
                    'default' => env('GROQ_TEXT_MODEL', 'llama-3.3-70b-versatile'),
                    'cheapest' => env('GROQ_TEXT_MODEL_CHEAPEST', 'llama-3.1-8b-instant'),
                    'smartest' => env('GROQ_TEXT_MODEL_SMARTEST', 'llama-3.3-70b-versatile'),
                ],
            ],
        ],

        'jina' => [
            'driver' => 'jina',
            'key' => env('JINA_API_KEY'),
        ],

        'mistral' => [
            'driver' => 'mistral',
            'key' => env('MISTRAL_API_KEY'),
        ],

        'ollama' => [
            'driver' => 'ollama',
            'key' => env('OLLAMA_API_KEY', ''),
            'url' => env('OLLAMA_URL', 'http://localhost:11434'),
        ],

        'openai' => [
            'driver' => 'openai',
            'key' => env('OPENAI_API_KEY'),
            'url' => env('OPENAI_URL', 'https://api.openai.com/v1'),
            'store' => env('OPENAI_STORE', true),
            // laravel/ai package defaults (gpt-5.6-*) are not public OpenAI IDs — override them.
            'models' => [
                'text' => [
                    'default' => env('OPENAI_TEXT_MODEL', 'gpt-4o-mini'),
                    'cheapest' => env('OPENAI_TEXT_MODEL_CHEAPEST', 'gpt-4o-mini'),
                    'smartest' => env('OPENAI_TEXT_MODEL_SMARTEST', 'gpt-4o'),
                ],
                'embeddings' => [
                    'default' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
                    'dimensions' => (int) env('OPENAI_EMBEDDING_DIMENSIONS', 1536),
                ],
            ],
        ],

        'openai-compatible' => [
            'driver' => 'openai-compatible',
            'url' => env('OPENAI_COMPATIBLE_URL'),
            'key' => env('OPENAI_COMPATIBLE_API_KEY'),
        ],

        'openrouter' => [
            'driver' => 'openrouter',
            'key' => env('OPENROUTER_API_KEY'),
        ],

        'voyageai' => [
            'driver' => 'voyageai',
            'key' => env('VOYAGEAI_API_KEY'),
        ],

        'xai' => [
            'driver' => 'xai',
            'key' => env('XAI_API_KEY'),
        ],
    ],

];
