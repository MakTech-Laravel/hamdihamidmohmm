<?php

use App\Enums\ContentPageStatus;
use App\Enums\ContentPageType;
use App\Models\ContentPage;
use App\Models\EmailTemplate;
use App\Models\User;
use App\Notifications\PolicyUpdatedNotification;
use Illuminate\Support\Facades\Notification;

test('admins can customize the policy updated email template', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'group' => 'email_templates',
            'values' => [
                'subject' => 'Policy change: {{policy_title}}',
                'body' => "Hi {{name}},\nSee {{policy_url}}\n— {{platform_name}}",
            ],
        ])
        ->assertRedirect();

    $template = EmailTemplate::query()->where('key', 'policy_updated')->first();

    expect($template)->not->toBeNull()
        ->and($template->subject)->toBe('Policy change: {{policy_title}}')
        ->and($template->body)->toContain('{{policy_url}}');
});

test('publishing content notifies job seekers with the customized template', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Sara Seeker']);
    $employer = User::factory()->employer()->create();

    EmailTemplate::factory()->create([
        'key' => 'policy_updated',
        'subject' => 'Updated: {{policy_title}}',
        'body' => 'Hello {{name}}, review {{policy_title}} at {{policy_url}}.',
    ]);

    $page = ContentPage::factory()->create([
        'title' => 'Privacy Policy',
        'slug' => 'privacy-policy',
        'type' => ContentPageType::Page,
        'status' => ContentPageStatus::Draft,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.content.publish', $page))
        ->assertRedirect();

    Notification::assertSentTo(
        $seeker,
        PolicyUpdatedNotification::class,
        function (PolicyUpdatedNotification $notification) use ($seeker): bool {
            expect($notification->policyTitle)->toBe('Privacy Policy')
                ->and($notification->toMail($seeker)->subject)
                ->toBe('Updated: Privacy Policy');

            return true;
        },
    );

    Notification::assertNotSentTo($employer, PolicyUpdatedNotification::class);
});
