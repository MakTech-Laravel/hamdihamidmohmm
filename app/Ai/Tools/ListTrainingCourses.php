<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Models\TrainingCourse;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ListTrainingCourses implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'List the published training courses with dates, location, trainer, remaining seats, '
            .'registration deadline and the registration link.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $courses = TrainingCourse::query()
            ->published()
            ->withOccupiedSeats()
            ->orderByRaw('starts_on IS NULL')
            ->orderBy('starts_on')
            ->limit(10)
            ->get()
            ->map(fn (TrainingCourse $course): array => [
                'title' => $course->title,
                'starts_on' => $course->starts_on?->toDateString(),
                'ends_on' => $course->ends_on?->toDateString(),
                'duration' => $course->duration,
                'location' => $course->location,
                'trainer' => $course->trainer,
                'seats_left' => $course->seats !== null ? max(0, $course->seats - $course->occupiedSeats()) : null,
                'registration_deadline' => $course->registration_deadline?->toDateString(),
                'details_url' => route('training.courses.show', $course->slug, absolute: false),
                'register_url' => route('training.courses.register', $course->slug, absolute: false),
            ])
            ->values()
            ->all();

        return $this->encode([
            'courses' => $courses,
            'all_courses_url' => route('training.courses.index', absolute: false),
            'training_resources_url' => route('training', absolute: false),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
