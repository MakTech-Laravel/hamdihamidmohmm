<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerPortalPageController extends Controller
{
    public function notifications(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('backend/User/EmployerNotifications', [
            'notifications' => $user?->notifications()->latest()->get()->map(fn ($notification) => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'category' => $notification->data['category'] ?? 'System',
                'read' => $notification->read_at !== null,
                'created_at' => $notification->created_at?->diffForHumans(),
            ]),
            'unread' => $user?->unreadNotifications()->count() ?? 0,
        ]);
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $request->user()?->notifications()->where('id', $notification)->first()?->markAsRead();

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()?->unreadNotifications->markAsRead();

        return back()->with('success', 'All notifications marked as read.');
    }

    public function settings(Request $request): Response
    {
        return Inertia::render('backend/User/EmployerSettings', [
            'profile' => [
                'name' => $request->user()?->name,
                'email' => $request->user()?->email,
                'company_name' => $request->user()?->company_name,
            ],
        ]);
    }
}
