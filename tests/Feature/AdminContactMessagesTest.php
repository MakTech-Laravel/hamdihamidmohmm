<?php

use App\Models\ContactMessage;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Support\Facades\Notification;

test('contact form submissions are stored for admins to review', function () {
    $admin = User::factory()->admin()->create();

    Notification::fake();

    $this->from(route('contact'))
        ->post(route('contact.store'), [
            'name' => 'Sara Ahmed',
            'email' => 'sara@example.com',
            'phone' => '+966500000000',
            'message' => 'I would like to know more about employer packages.',
        ])
        ->assertRedirect(route('contact'))
        ->assertSessionHas('success', true);

    $message = ContactMessage::query()->first();

    expect($message)->not->toBeNull()
        ->and($message->name)->toBe('Sara Ahmed')
        ->and($message->email)->toBe('sara@example.com')
        ->and($message->phone)->toBe('+966500000000')
        ->and($message->message)->toBe('I would like to know more about employer packages.')
        ->and($message->read_at)->toBeNull();

    Notification::assertSentTo(
        $admin,
        PortalNotification::class,
        fn (PortalNotification $notification): bool => $notification->title === 'New contact message'
            && $notification->category === 'Contact'
            && str_contains($notification->message, 'Sara Ahmed'),
    );
});

test('new contact messages increase admin bell unread notification count', function () {
    $admin = User::factory()->admin()->create();

    $this->from(route('contact'))
        ->post(route('contact.store'), [
            'name' => 'Sara Ahmed',
            'email' => 'sara@example.com',
            'message' => 'Please call me back about pricing.',
        ])
        ->assertRedirect(route('contact'));

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('unread_notifications', 1)
            ->where('admin_nav_badges.contact_messages', 1)
            ->where('admin_nav_badges.notifications', 1));
});

test('admins can view contact messages inbox', function () {
    $admin = User::factory()->admin()->create();
    ContactMessage::factory()->create([
        'name' => 'Omar Ali',
        'email' => 'omar@example.com',
        'message' => 'Need help with verification.',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.contact-messages.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/ContactMessages')
            ->where('messages.0.name', 'Omar Ali')
            ->where('messages.0.email', 'omar@example.com')
            ->where('unread', 1));
});

test('admins can mark contact messages as read', function () {
    $admin = User::factory()->admin()->create();
    $message = ContactMessage::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.contact-messages.read', $message))
        ->assertRedirect();

    expect($message->fresh()->read_at)->not->toBeNull();
});

test('admins can delete contact messages', function () {
    $admin = User::factory()->admin()->create();
    $message = ContactMessage::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.contact-messages.destroy', $message))
        ->assertRedirect();

    expect(ContactMessage::query()->find($message->id))->toBeNull();
});

test('non admins cannot access contact messages inbox', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('admin.contact-messages.index'))
        ->assertRedirect();
});
