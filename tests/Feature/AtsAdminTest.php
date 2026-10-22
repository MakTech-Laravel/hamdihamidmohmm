<?php

use App\Enums\AtsScreeningStatus;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Ats\ApplicationScreeningService;
use App\Services\Ats\AtsSettings;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('the admin AI assistant page includes the ATS overview', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->employer()->create(['ats_enabled' => false]);
    $application = atsApplication();
    app(ApplicationScreeningService::class)->screen($application);
    atsApplication(cvText: null)->forceFill(['ai_status' => AtsScreeningStatus::NoCv, 'ai_scored_at' => now()])->saveQuietly();

    $this->actingAs($admin)
        ->get(route('admin.ai-assistant.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AiAssistant')
            ->where('ats.settings', ['enabled' => true, 'ai_enabled' => true])
            ->where('ats.config_enabled', true)
            ->where('ats.config_ai_enabled', false)
            ->where('ats.disabled_employers', 1)
            ->where('ats.stats.scored', 1)
            ->where('ats.stats.rules', 1)
            ->where('ats.stats.ai', 0)
            ->where('ats.stats.no_cv', 1)
            ->where('ats.stats.pending', 0)
            ->where('ats.stats.tokens_today', 0)
            ->where('ats.stats.daily_token_budget', 0)
            ->has('ats.providers'));
});

test('admins can update the ATS screening switches', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.ai-assistant.ats-settings.update'), [
            'enabled' => true,
            'ai_enabled' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'ATS screening settings saved.');

    expect(PlatformSetting::atsScreening())->toBe(['enabled' => true, 'ai_enabled' => false])
        ->and(PlatformSetting::aiAssistant())->toBe(['public_chat_enabled' => true, 'admin_assistant_enabled' => true])
        ->and(app(AtsSettings::class)->aiEnabled())->toBeFalse();
});

test('disabling ATS globally stops screening', function () {
    $admin = User::factory()->admin()->create();
    $application = atsApplication();

    $this->actingAs($admin)
        ->put(route('admin.ai-assistant.ats-settings.update'), ['enabled' => false, 'ai_enabled' => false]);

    expect(app(AtsSettings::class)->enabledForEmployer($application->jobPost->employer))->toBeFalse();
});

test('ATS settings require both switches', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.ai-assistant.ats-settings.update'), ['enabled' => 'maybe'])
        ->assertSessionHasErrors(['enabled', 'ai_enabled']);
});

test('non admins cannot update ATS settings or toggle employers', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->put(route('admin.ai-assistant.ats-settings.update'), ['enabled' => false, 'ai_enabled' => false])
        ->assertRedirect();

    $this->actingAs($employer)
        ->post(route('admin.employers.ats-toggle', $employer), ['ats_enabled' => false])
        ->assertRedirect();

    expect(PlatformSetting::atsScreening()['enabled'])->toBeTrue()
        ->and($employer->fresh()->ats_enabled)->toBeTrue();
});

test('admins can switch AI screening off and on for an employer', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($admin)
        ->post(route('admin.employers.ats-toggle', $employer), ['ats_enabled' => false])
        ->assertRedirect()
        ->assertSessionHas('success', 'AI screening disabled for this employer.');

    expect($employer->fresh()->ats_enabled)->toBeFalse();

    $this->actingAs($admin)
        ->get(route('admin.employers.show', $employer))
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/EmployerShow')
            ->where('employer.ats_enabled', false));

    $this->actingAs($admin)
        ->post(route('admin.employers.ats-toggle', $employer), ['ats_enabled' => true])
        ->assertSessionHas('success', 'AI screening enabled for this employer.');

    expect($employer->fresh()->ats_enabled)->toBeTrue();
});

test('the employer ATS toggle validates input and only applies to employers', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->post(route('admin.employers.ats-toggle', $employer), [])
        ->assertSessionHasErrors('ats_enabled');

    $this->actingAs($admin)
        ->post(route('admin.employers.ats-toggle', $seeker), ['ats_enabled' => false])
        ->assertNotFound();
});

test('admin application monitoring shows the AI score read-only', function () {
    $admin = User::factory()->admin()->create();
    $application = atsApplication();
    app(ApplicationScreeningService::class)->screen($application);

    $this->actingAs($admin)
        ->get(route('admin.applications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/ApplicationsMonitoring')
            ->where('applications.data.0.ai.ai_score', 88)
            ->where('applications.data.0.ai.ai_status', 'completed')
            ->where('applications.data.0.ai.ai_source', 'rules')
            ->where('applications.data.0.ai.ai_model', 'rules')
            ->where('applications.data.0.ai.ai_rescore_url', null)
            ->where('applications.data.0.preview.ai.ai_score', 88));
});
