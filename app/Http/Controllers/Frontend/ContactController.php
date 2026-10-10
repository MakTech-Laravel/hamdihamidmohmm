<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactMessageRequest;
use App\Models\ContactMessage;
use App\Support\PortalNotifier;
use Illuminate\Http\RedirectResponse;

class ContactController extends Controller
{
    public function store(ContactMessageRequest $request): RedirectResponse
    {
        $message = ContactMessage::query()->create($request->validated());

        PortalNotifier::contactMessageReceived(
            $message->name,
            $message->email,
            $message->message,
        );

        return back()->with('success', true);
    }
}
