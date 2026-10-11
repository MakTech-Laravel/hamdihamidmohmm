<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\TrainingQuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreTrainingCourseRequest;
use App\Http\Requests\Backend\Admin\UpdateTrainingCourseRequest;
use App\Models\TrainingCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TrainingCourseController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageCms() === true, 403);

        $courses = TrainingCourse::query()
            ->withOccupiedSeats()
            ->withCount('registrations')
            ->latest()
            ->get()
            ->map(fn (TrainingCourse $course): array => [
                'id' => $course->id,
                'title' => $course->title,
                'starts_on' => $course->starts_on?->format('M j, Y'),
                'registration_deadline' => $course->registration_deadline?->format('M j, Y'),
                'seats' => $course->seats,
                'available_seats' => $course->availableSeats(),
                'registrations_count' => $course->registrations_count,
                'is_published' => $course->is_published,
            ]);

        return Inertia::render('backend/Admin/TrainingCourses', [
            'courses' => $courses,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->canManageCms() === true, 403);

        return Inertia::render('backend/Admin/TrainingCourseForm', [
            'course' => null,
            'questionTypes' => $this->questionTypes(),
        ]);
    }

    public function store(StoreTrainingCourseRequest $request): RedirectResponse
    {
        $course = TrainingCourse::query()->create($request->courseAttributes());
        $this->storeThumbnail($request, $course);

        return to_route('admin.training.courses.index')
            ->with('success', 'Training course created.');
    }

    public function edit(Request $request, TrainingCourse $trainingCourse): Response
    {
        abort_unless($request->user()?->canManageCms() === true, 403);

        return Inertia::render('backend/Admin/TrainingCourseForm', [
            'course' => $this->formCourse($trainingCourse),
            'questionTypes' => $this->questionTypes(),
        ]);
    }

    public function update(UpdateTrainingCourseRequest $request, TrainingCourse $trainingCourse): RedirectResponse
    {
        $attributes = $request->courseAttributes();
        $attributes['slug'] = $trainingCourse->slug;

        $trainingCourse->update($attributes);
        $this->storeThumbnail($request, $trainingCourse);

        return to_route('admin.training.courses.index')
            ->with('success', 'Training course updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formCourse(TrainingCourse $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'starts_on' => $course->starts_on?->toDateString(),
            'ends_on' => $course->ends_on?->toDateString(),
            'duration' => $course->duration,
            'location' => $course->location,
            'trainer' => $course->trainer,
            'seats' => $course->seats,
            'registration_deadline' => $course->registration_deadline?->toDateString(),
            'is_published' => $course->is_published,
            'questions' => $course->normalizedQuestions(),
            'thumbnail_url' => $course->thumbnailUrl(),
        ];
    }

    private function storeThumbnail(Request $request, TrainingCourse $course): void
    {
        $thumbnail = $request->file('thumbnail');

        if (! $thumbnail instanceof UploadedFile) {
            return;
        }

        if (filled($course->thumbnail_path)) {
            Storage::disk('public')->delete($course->thumbnail_path);
        }

        $course->forceFill([
            'thumbnail_path' => $thumbnail->store('training-courses', 'public'),
        ])->save();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function questionTypes(): array
    {
        return collect(TrainingQuestionType::cases())
            ->map(fn (TrainingQuestionType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ])
            ->values()
            ->all();
    }
}
