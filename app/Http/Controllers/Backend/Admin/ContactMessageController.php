<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactMessageController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isAdmin() === true, 403);

        $tab = $request->string('tab')->toString() ?: 'all';

        $query = ContactMessage::query()->latest();

        if ($tab === 'unread') {
            $query->whereNull('read_at');
        }

        $messages = $query->get()->map(fn (ContactMessage $message): array => [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'phone' => $message->phone,
            'message' => $message->message,
            'read' => $message->read_at !== null,
            'created_at' => $message->created_at?->diffForHumans(),
            'created_at_exact' => $message->created_at?->format('M j, Y g:i A'),
        ]);

        return Inertia::render('backend/Admin/ContactMessages', [
            'messages' => $messages,
            'unread' => ContactMessage::query()->whereNull('read_at')->count(),
            'tab' => $tab,
        ]);
    }

    public function markRead(Request $request, ContactMessage $contactMessage): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin() === true, 403);

        $contactMessage->markAsRead();

        return back()->with('success', 'Message marked as read.');
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin() === true, 403);

        ContactMessage::query()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'All messages marked as read.');
    }

    public function destroy(Request $request, ContactMessage $contactMessage): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin() === true, 403);

        $contactMessage->delete();

        return back()->with('success', 'Message deleted.');
    }
}
