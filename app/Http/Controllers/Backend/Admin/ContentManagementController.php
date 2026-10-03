<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\ContentPageStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreContentPageRequest;
use App\Http\Requests\Backend\Admin\UpdateContentPageRequest;
use App\Models\ContentPage;
use App\Models\User;
use App\Notifications\PolicyUpdatedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class ContentManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageCms(), 403);

        $pages = ContentPage::query()->latest()->get()->map(fn(ContentPage $page) => [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'type' => $page->type?->label(),
            'type_value' => $page->type?->value,
            'status' => $page->status?->label(),
            'status_value' => $page->status?->value,
            'body' => $page->body,
            'updated_at' => $page->updated_at?->diffForHumans(),
        ]);

        return Inertia::render('backend/Admin/ContentManagement', [
            'pages' => $pages,
        ]);
    }

    public function store(StoreContentPageRequest $request): RedirectResponse
    {
        $page = ContentPage::query()->create($request->validated());

        $this->notifySeekersIfPublished($page);

        return back()->with('success', 'Content created.');
    }

    public function update(UpdateContentPageRequest $request, ContentPage $contentPage): RedirectResponse
    {
        $contentPage->update($request->validated());

        $this->notifySeekersIfPublished($contentPage->fresh());

        return back()->with('success', 'Content updated.');
    }

    public function publish(Request $request, ContentPage $contentPage): RedirectResponse
    {
        abort_unless($request->user()?->canManageCms(), 403);

        $wasPublished = $contentPage->status === ContentPageStatus::Published;

        $contentPage->forceFill([
            'status' => $wasPublished
                ? ContentPageStatus::Draft
                : ContentPageStatus::Published,
        ])->save();

        if (! $wasPublished && $contentPage->status === ContentPageStatus::Published) {
            $this->notifySeekersIfPublished($contentPage);
        }

        return back()->with('success', 'Content status updated.');
    }

    public function destroy(Request $request, ContentPage $contentPage): RedirectResponse
    {
        abort_unless($request->user()?->canManageCms(), 403);

        $contentPage->delete();

        return back()->with('success', 'Content deleted.');
    }

    private function notifySeekersIfPublished(?ContentPage $page): void
    {
        if ($page === null || $page->status !== ContentPageStatus::Published) {
            return;
        }

        $seekers = User::query()
            ->where(function ($query): void {
                $query->where('role', UserRole::JobSeeker)
                    ->orWhereHas('roles', fn($roleQuery) => $roleQuery->where('name', 'job-seeker'));
            })
            ->get();

        if ($seekers->isEmpty()) {
            return;
        }

        Notification::send(
            $seekers,
            new PolicyUpdatedNotification(
                (string) $page->title,
                url('/' . $page->slug),
            ),
        );
    }
}
