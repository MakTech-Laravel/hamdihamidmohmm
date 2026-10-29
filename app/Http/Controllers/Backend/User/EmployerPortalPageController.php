<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\EmployerAccountStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\DeactivateEmployerAccountRequest;
use App\Http\Requests\Backend\User\DeleteEmployerAccountRequest;
use App\Http\Requests\Backend\User\UpdateEmployerAccountRequest;
use App\Http\Requests\Backend\User\UpdateEmployerNotificationPreferencesRequest;
use App\Http\Requests\Backend\User\UpdateEmployerPrivacyPreferencesRequest;
use App\Support\ListPageSize;
use App\Support\PortalPreferences;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployerPortalPageController extends Controller
{
    private const NOTIFICATION_FILTERS = ['all', 'unread', 'applications', 'jobs', 'billing', 'system'];

    /**
     * @var array<string, list<string>>
     */
    private const CATEGORY_FILTER_VALUES = [
        'applications' => ['application', 'applications'],
        'jobs' => ['job', 'jobs'],
        'billing' => ['billing'],
    ];

    public function notifications(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $filter = $this->notificationFilter($request);

        $notifications = $this->applyNotificationFilter($user->notifications()->getQuery(), $filter)
            ->latest()
            ->paginate(ListPageSize::DEFAULT)
            ->withQueryString()
            ->through(fn (DatabaseNotification $notification): array => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'message' => $notification->data['message'] ?? '',
                'category' => $notification->data['category'] ?? 'System',
                'category_key' => $this->categoryKey($notification->data['category'] ?? 'System'),
                'read' => $notification->read_at !== null,
                'created_at' => $notification->created_at?->diffForHumans(),
            ]);

        $counts = [];

        foreach (self::NOTIFICATION_FILTERS as $filterId) {
            $counts[$filterId] = $this->applyNotificationFilter($user->notifications()->getQuery(), $filterId)->count();
        }

        return Inertia::render('backend/User/EmployerNotifications', [
            'notifications' => $notifications,
            'filter' => $filter,
            'counts' => $counts,
            'unread' => $user->unreadNotifications()->count(),
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
                'name' => $user?->name,
                'contact_name' => $user?->contact_name ?: $user?->name,
                'email' => $user?->email,
                'phone' => $user?->phone,
                'company_name' => $user?->company_name,
                'photo_url' => filled($user?->avatar_url) ? $user->avatar_url : null,
                'personal_initials' => collect(explode(' ', (string) ($user?->name ?? '')))
                    ->filter()
                    ->take(2)
                    ->map(fn (string $part): string => strtoupper(substr($part, 0, 1)))
                    ->implode(''),
            ],
            'preferences' => [
                'notifications' => $preferences['notifications'],
                'privacy' => $preferences['privacy'],
            ],
        ]);
    }

    public function updateSettings(UpdateEmployerAccountRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $request->user()?->forceFill([
            ...$validated,
            'contact_name' => $validated['name'],
        ])->save();

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

    private function notificationFilter(Request $request): string
    {
        $filter = $request->string('filter')->toString();

        return in_array($filter, self::NOTIFICATION_FILTERS, true) ? $filter : 'all';
    }

    /**
     * @param  Builder<DatabaseNotification>  $query
     * @return Builder<DatabaseNotification>
     */
    private function applyNotificationFilter(Builder $query, string $filter): Builder
    {
        if ($filter === 'unread') {
            return $query->whereNull('read_at');
        }

        if ($filter === 'system') {
            return $query->where(function (Builder $builder): void {
                $builder->whereNull('data->category')
                    ->orWhereNotIn('data->category', $this->knownCategoryValues());
            });
        }

        if (isset(self::CATEGORY_FILTER_VALUES[$filter])) {
            return $query->whereIn('data->category', $this->categoryValueVariants(self::CATEGORY_FILTER_VALUES[$filter]));
        }

        return $query;
    }

    /**
     * @return list<string>
     */
    private function knownCategoryValues(): array
    {
        return $this->categoryValueVariants([
            ...self::CATEGORY_FILTER_VALUES['applications'],
            ...self::CATEGORY_FILTER_VALUES['jobs'],
            ...self::CATEGORY_FILTER_VALUES['billing'],
            'verification',
        ]);
    }

    /**
     * @param  list<string>  $values
     * @return list<string>
     */
    private function categoryValueVariants(array $values): array
    {
        return collect($values)
            ->flatMap(fn (string $value): array => [$value, ucfirst($value), strtoupper($value)])
            ->unique()
            ->values()
            ->all();
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
