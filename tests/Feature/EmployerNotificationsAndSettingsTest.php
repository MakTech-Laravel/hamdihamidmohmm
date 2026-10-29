<?php

use App\Models\User;
use App\Notifications\PortalNotification;

test('employers see live notifications with category keys', function () {
    $employer = User::factory()->employer()->create();
    $employer->notify(new PortalNotification(
        '5 New Applications',
        'You received 5 new applications for Senior Frontend Developer.',
        'Application',
    ));
    $employer->notify(new PortalNotification(
        'Package Activated',
        'Business package has been activated.',
        'Billing',
    ));

    $this->actingAs($employer)
        ->get(route('employer.notifications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerNotifications')
            ->where('unread', 2)
            ->has('notifications.data', 2)
            ->where('notifications.data.0.category_key', 'applications')
            ->where('notifications.data.0.read', false)
            ->where('filter', 'all')
            ->where('counts.all', 2)
            ->where('counts.applications', 1)
            ->where('counts.billing', 1)
            ->where('counts.unread', 2));
});

test('employer notifications are filtered and paginated on the server', function () {
    $employer = User::factory()->employer()->create();

    foreach (range(1, 31) as $index) {
        $employer->notifyNow(new PortalNotification("Billing {$index}", 'Invoice ready.', 'Billing'));
    }

    $employer->notifyNow(new PortalNotification('New applicant', 'Someone applied.', 'Application'));
    $employer->notifyNow(new PortalNotification('Policy update', 'Terms changed.', 'Policy'));
    $employer->notifyNow(new PortalNotification('Unknown', 'No category.', 'Custom'));
    $employer->notifications()->where('data->category', 'Application')->first()?->markAsRead();

    $this->actingAs($employer)
        ->get(route('employer.notifications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('notifications.data', 30)
            ->where('notifications.total', 34)
            ->where('notifications.per_page', 30)
            ->where('counts.all', 34)
            ->where('counts.unread', 33)
            ->where('counts.billing', 31)
            ->where('counts.applications', 1)
            ->where('counts.system', 2));

    $this->actingAs($employer)
        ->get(route('employer.notifications', ['filter' => 'billing', 'page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filter', 'billing')
            ->has('notifications.data', 1)
            ->where('notifications.total', 31)
            ->where('notifications.data.0.category_key', 'billing'));

    $this->actingAs($employer)
        ->get(route('employer.notifications', ['filter' => 'applications']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('notifications.data', 1)
            ->where('notifications.data.0.category_key', 'applications'));

    $this->actingAs($employer)
        ->get(route('employer.notifications', ['filter' => 'system']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('notifications.data', 2));

    $this->actingAs($employer)
        ->get(route('employer.notifications', ['filter' => 'unread']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('notifications.total', 33));

    $this->actingAs($employer)
        ->get(route('employer.notifications', ['filter' => 'bogus']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filter', 'all')
            ->where('notifications.total', 34));
});

test('employers can mark a notification as read and delete it', function () {
    $employer = User::factory()->employer()->create();
    $employer->notifyNow(new PortalNotification('Job Expiring Soon', 'Expires in 23 days.', 'Job'));

    $notification = $employer->notifications()->first();

    expect($notification)->not->toBeNull();

    $this->actingAs($employer)
        ->post(route('employer.notifications.read', $notification->id))
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();

    $this->actingAs($employer)
        ->delete(route('employer.notifications.destroy', $notification->id))
        ->assertRedirect();

    expect($employer->notifications()->count())->toBe(0);
});

test('employers can mark all notifications as read', function () {
    $employer = User::factory()->employer()->create();
    $employer->notifyNow(new PortalNotification('One', 'First', 'System'));
    $employer->notifyNow(new PortalNotification('Two', 'Second', 'System'));

    $this->actingAs($employer)
        ->post(route('employer.notifications.read-all'))
        ->assertRedirect();

    expect($employer->unreadNotifications()->count())->toBe(0);
});

test('employer settings receive contact details', function () {
    $employer = User::factory()->employer()->create([
        'name' => 'Fatima Al-Zahrani',
        'contact_name' => 'Fatima Al-Zahrani',
        'email' => 'hr@techcorp.com',
        'phone' => '+966 11 234 5678',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerSettings')
            ->where('profile.name', 'Fatima Al-Zahrani')
            ->where('profile.contact_name', 'Fatima Al-Zahrani')
            ->where('profile.email', 'hr@techcorp.com')
            ->where('profile.phone', '+966 11 234 5678')
            ->where('profile.photo_url', null));
});

test('employers can update account settings from the settings page', function () {
    $employer = User::factory()->employer()->create([
        'name' => 'Fatima Al-Zahrani',
        'contact_name' => 'Fatima Al-Zahrani',
        'phone' => '+966 11 234 5678',
    ]);

    $this->actingAs($employer)
        ->put(route('employer.settings.update'), [
            'name' => 'Sara Mansour',
            'email' => $employer->email,
            'phone' => '+971 50 123 4567',
        ])
        ->assertRedirect();

    expect($employer->fresh())
        ->name->toBe('Sara Mansour')
        ->contact_name->toBe('Sara Mansour')
        ->phone->toBe('+971 50 123 4567');
});
