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
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerNotifications')
            ->where('unread', 2)
            ->has('notifications', 2)
            ->where('notifications.0.category_key', 'applications')
            ->where('notifications.0.read', false));
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
        ->assertInertia(fn($page) => $page
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
