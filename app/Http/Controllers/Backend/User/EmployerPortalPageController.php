<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\EmployerAccountStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\DeactivateEmployerAccountRequest;
use App\Http\Requests\Backend\User\DeleteEmployerAccountRequest;
use App\Http\Requests\Backend\User\UpdateEmployerAccountRequest;
use App\Http\Requests\Backend\User\UpdateEmployerNotificationPreferencesRequest;
use App\Http\Requests\Backend\User\UpdateEmployerPrivacyPreferencesRequest;
use App\Support\PortalPreferences;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $preferences = PortalPreferences::for($user);

        return Inertia::render('backend/User/EmployerSettings', [
            'profile' => [
                'contact_name' => $user?->contact_name ?: $user?->name,
                'email' => $user?->email,
                'phone' => $user?->phone,
                'company_name' => $user?->company_name,
            ],
            'preferences' => [
                'notifications' => $preferences['notifications'],
                'privacy' => $preferences['privacy'],
            ],
        ]);
    }

    public function updateSettings(UpdateEmployerAccountRequest $request): RedirectResponse
    {
        $request->user()?->forceFill($request->validated())->save();

        return back()->with('success', 'Account settings saved.');
    }

    public function updateNotificationPreferences(UpdateEmployerNotificationPreferencesRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $user->forceFill([
            'portal_preferences' => PortalPreferences::mergeNotifications($user, $request->validated()),
        ])->save();

        return back()->with('success', 'Notification preferences saved.');
    }

    public function updatePrivacyPreferences(UpdateEmployerPrivacyPreferencesRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $user->forceFill([
            'portal_preferences' => PortalPreferences::mergePrivacy($user, $request->validated()),
        ])->save();

        return back()->with('success', 'Privacy settings saved.');
    }

    public function deactivate(DeactivateEmployerAccountRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $user->forceFill([
            'account_status' => EmployerAccountStatus::Suspended,
        ])->save();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Your employer account has been deactivated.');
    }

    public function destroy(DeleteEmployerAccountRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Your employer account has been deleted.');
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
