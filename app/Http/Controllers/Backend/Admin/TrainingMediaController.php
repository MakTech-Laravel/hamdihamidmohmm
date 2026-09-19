<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UploadTrainingVideoRequest;
use App\Support\TrainingMedia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrainingMediaController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageCms(), 403);

        return Inertia::render('backend/Admin/TrainingMedia', [
            'heroVideoUrl' => TrainingMedia::heroVideoUrl(),
        ]);
    }

    public function store(UploadTrainingVideoRequest $request): RedirectResponse
    {
        $video = $request->file('video');

        if ($video === null) {
            return back()->withErrors(['video' => __('Please choose a video file.')]);
        }

        TrainingMedia::storeHeroVideo($video);

        return back()->with('success', 'Training video uploaded.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->canManageCms(), 403);

        TrainingMedia::clearHeroVideo();

        return back()->with('success', 'Training video removed.');
    }
}
