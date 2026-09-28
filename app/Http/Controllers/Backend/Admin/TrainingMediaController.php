<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UploadTrainingDocumentRequest;
use App\Http\Requests\Backend\Admin\UploadTrainingVideoRequest;
use App\Support\TrainingMedia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class TrainingMediaController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageCms(), 403);

        return Inertia::render('backend/Admin/TrainingMedia', [
            'videos' => TrainingMedia::videos(),
            'heroVideoUrl' => TrainingMedia::heroVideoUrl(),
            'documents' => TrainingMedia::documents(),
            'maxVideos' => TrainingMedia::MAX_VIDEOS,
        ]);
    }

    public function store(UploadTrainingVideoRequest $request): RedirectResponse
    {
        $files = $this->uploadedVideos($request);

        if ($files === []) {
            return back()->withErrors(['video' => __('Please choose a video file.')]);
        }

        $name = $request->string('name')->toString() ?: null;

        foreach ($files as $index => $file) {
            TrainingMedia::storeVideo(
                $file,
                $index === 0 && count($files) === 1 ? $name : null,
            );
        }

        return back()->with('success', count($files) === 1
            ? 'Training video uploaded.'
            : 'Training videos uploaded.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->canManageCms(), 403);

        TrainingMedia::clearHeroVideo();

        return back()->with('success', 'Training video removed.');
    }

    public function destroyVideo(Request $request, string $video): RedirectResponse
    {
        abort_unless($request->user()?->canManageCms(), 403);

        if (! TrainingMedia::deleteVideo($video)) {
            return back()->withErrors(['video' => __('Video not found.')]);
        }

        return back()->with('success', 'Training video removed.');
    }

    public function storeDocument(UploadTrainingDocumentRequest $request): RedirectResponse
    {
        $document = $request->file('document');

        if ($document === null) {
            return back()->withErrors(['document' => __('Please choose a document file.')]);
        }

        TrainingMedia::storeDocument(
            $document,
            $request->string('name')->toString() ?: null,
        );

        return back()->with('success', 'Training document uploaded.');
    }

    public function destroyDocument(Request $request, string $document): RedirectResponse
    {
        abort_unless($request->user()?->canManageCms(), 403);

        if (! TrainingMedia::deleteDocument($document)) {
            return back()->withErrors(['document' => __('Document not found.')]);
        }

        return back()->with('success', 'Training document removed.');
    }

    /**
     * @return list<UploadedFile>
     */
    private function uploadedVideos(UploadTrainingVideoRequest $request): array
    {
        $videos = $request->file('videos');

        if (is_array($videos)) {
            return array_values(array_filter(
                $videos,
                fn(mixed $file): bool => $file instanceof UploadedFile,
            ));
        }

        $video = $request->file('video');

        return $video instanceof UploadedFile ? [$video] : [];
    }
}
