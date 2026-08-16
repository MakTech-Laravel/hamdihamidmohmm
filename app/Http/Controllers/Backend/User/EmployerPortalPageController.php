<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateEmployerAccountRequest;
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
                'category_key' => $this->categoryKey($notification->data['category'] ?? 'System'),
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

    public function destroyNotification(Request $request, string $notification): RedirectResponse
    {
        $request->user()?->notifications()->where('id', $notification)->delete();

        return back()->with('success', 'Notification deleted.');
    }

    public function settings(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('backend/User/EmployerSettings', [
            'profile' => [
                'contact_name' => $user?->contact_name ?: $user?->name,
                'email' => $user?->email,
                'phone' => $user?->phone,
                'company_name' => $user?->company_name,
            ],
        ]);
    }

    public function updateSettings(UpdateEmployerAccountRequest $request): RedirectResponse
    {
        $request->user()?->forceFill($request->validated())->save();

        return back()->with('success', 'Account settings saved.');
    }

    private function categoryKey(mixed $category): string
    {
        $value = strtolower(trim((string) $category));

        return match (true) {
            in_array($value, ['application', 'applications'], true) => 'applications',
            in_array($value, ['job', 'jobs'], true) => 'jobs',
            $value === 'billing' => 'billing',
            $value === 'verification' => 'verification',
            default => 'system',
        };
    }
}
