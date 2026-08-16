<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\SendNotificationRequest;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class AdminNotificationController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $user = $request->user();
        $tab = $request->string('tab')->toString() ?: 'all';

        $notifications = $user->notifications()->latest()->get()->map(fn ($notification) => [
            'id' => $notification->id,
            'title' => $notification->data['title'] ?? 'Notification',
            'message' => $notification->data['message'] ?? '',
            'category' => $notification->data['category'] ?? 'System',
            'read' => $notification->read_at !== null,
            'created_at' => $notification->created_at?->diffForHumans(),
        ]);

        if ($tab === 'unread') {
            $notifications = $notifications->where('read', false)->values();
        }

        return Inertia::render('backend/Admin/AdminNotifications', [
            'notifications' => $notifications,
            'unread' => $user->unreadNotifications()->count(),
            'tab' => $tab,
        ]);
    }

    public function store(SendNotificationRequest $request): RedirectResponse
    {
        $audience = $request->string('audience')->toString();

        $query = User::query();

        if ($audience === 'employers') {
            $query->where('role', UserRole::Employer);
        } elseif ($audience === 'job_seekers') {
            $query->where('role', UserRole::JobSeeker);
        }

        Notification::send(
            $query->get(),
            new PortalNotification(
                $request->string('title')->toString(),
                $request->string('message')->toString(),
                $request->string('category')->toString(),
            ),
        );

        return back()->with('success', 'Notification sent.');
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $request->user()?->notifications()->where('id', $notification)->first()?->markAsRead();

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $request->user()?->unreadNotifications->markAsRead();

        return back()->with('success', 'All notifications marked as read.');
    }
}
