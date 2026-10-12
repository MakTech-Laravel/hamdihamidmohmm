<?php

namespace App\Providers;

use App\Listeners\LogUserLogin;
use App\Models\JobPost;
use App\Support\MailBranding;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\View\View as ViewInstance;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Route::bind('jobPost', function (string $value): JobPost {
            return JobPost::query()
                ->where('id', $value)
                ->orWhere('slug', $value)
                ->firstOrFail();
        });

        Event::listen(Login::class, LogUserLogin::class);

        View::composer('mail.partials.footer', function (ViewInstance $view): void {
            $view->with(MailBranding::footer());
        });

        $this->configureChatRateLimits();
    }

    protected function configureChatRateLimits(): void
    {
        $tooManyMessages = fn (): JsonResponse => response()->json([
            'message' => __('chatbot.rate_limited'),
        ], 429);

        RateLimiter::for('ai-chat', function (Request $request) use ($tooManyMessages): array {
            $key = $request->user()?->id ?? $request->ip();

            return [
                Limit::perMinute((int) config('ai.chatbot.public_per_minute', 8))
                    ->by('ai-chat-minute:'.$key)
                    ->response($tooManyMessages),
                Limit::perDay((int) config('ai.chatbot.public_per_day', 120))
                    ->by('ai-chat-day:'.$key)
                    ->response($tooManyMessages),
            ];
        });

        RateLimiter::for('ai-admin-chat', fn (Request $request): Limit => Limit::perMinute((int) config('ai.chatbot.admin_per_minute', 20))
            ->by('ai-admin-chat:'.($request->user()?->id ?? $request->ip()))
            ->response($tooManyMessages));
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(8)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null
        );
    }
}
