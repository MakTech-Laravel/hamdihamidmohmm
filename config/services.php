<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'wheniwork' => [
        'api_key' => env('WHEN_I_WORK_API_KEY'),
        'login_url' => env('WHEN_I_WORK_LOGIN_URL', 'https://api.login.wheniwork.com/login'),
        'base_url' => env('WHEN_I_WORK_BASE_URL', 'https://api.wheniwork.com/2/'),
    ],

    'yallapay' => [
        'enabled' => env('YALLAPAY_ENABLED', true),
        'env' => env('YALLAPAY_ENV', 'sandbox'),
        'sandbox_url' => env('YALLAPAY_SANDBOX_URL', 'https://gateway-dev.yallapaysudan.com/api/v1'),
        'production_url' => env('YALLAPAY_PRODUCTION_URL', 'https://gateway.yallapaysudan.com/api/v1'),
        'token' => env('YALLAPAY_AUTH_TOKEN'),
        'webhook_secret' => env('YALLAPAY_WEBHOOK_SECRET'),
        // Public URLs for the YallaPay dashboard (Developer → Webhooks / Redirects).
        'webhook_url' => env('YALLAPAY_WEBHOOK_URL', rtrim((string) env('APP_URL', 'http://localhost'), '/').'/api/webhooks/yallapay'),
        'success_url' => env('YALLAPAY_SUCCESS_URL', rtrim((string) env('APP_URL', 'http://localhost'), '/').'/payment/yallapay/success'),
        'failed_url' => env('YALLAPAY_FAILED_URL', rtrim((string) env('APP_URL', 'http://localhost'), '/').'/payment/yallapay/failed'),
    ],

];
