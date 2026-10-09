<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\PermissionName;
use App\Enums\TrainingRegistrationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Frontend\StoreTrainingRegistrationRequest;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use App\Models\User;
use App\Notifications\TrainingRegistrationConfirmedNotification;
use App\Notifications\TrainingRegistrationReceivedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class TrainingRegistrationController extends Controller
{
    public function index(): Response
    {
        $courses = TrainingCourse::query()
            ->published()
            ->withOccupiedSeats()
            ->orderBy('starts_on')
            ->orderBy('title')
            ->get()
            ->map(fn (TrainingCourse $course): array => $this->courseCard($course));

        return Inertia::render('frontend/training-courses', [
            'courses' => $courses,
        ]);
    }

    public function show(TrainingCourse $trainingCourse): Response
    {
        abort_unless($trainingCourse->is_published, 404);

        $trainingCourse->loadCount([
            'registrations as occupied_seats_count' => function ($query): void {
                $query->whereIn('status', TrainingRegistrationStatus::occupyingValues());
            },
        ]);

        return Inertia::render('frontend/training-course-show', [
            'course' => $this->courseDetail($trainingCourse),
        ]);
    }

    public function create(TrainingCourse $trainingCourse): Response
    {
        abort_unless($trainingCourse->is_published, 404);

        $trainingCourse->loadCount([
            'registrations as occupied_seats_count' => function ($query): void {
                $query->whereIn('status', TrainingRegistrationStatus::occupyingValues());
            },
        ]);

        return Inertia::render('frontend/training-course-register', [
            'course' => $this->courseDetail($trainingCourse),
        ]);
    }

    public function store(StoreTrainingRegistrationRequest $request, TrainingCourse $trainingCourse): RedirectResponse
    {
        $registration = DB::transaction(function () use ($request, $trainingCourse): ?TrainingRegistration {
            $course = TrainingCourse::query()
                ->whereKey($trainingCourse->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $course->is_published || $course->registrationDeadlinePassed() || $course->occupiedSeats() >= $course->seats) {
                return null;
            }

            return $course->registrations()->create([
                'registration_number' => TrainingRegistration::nextRegistrationNumber(),
                'public_token' => TrainingRegistration::newPublicToken(),
                'full_name' => $request->string('full_name')->toString(),
                'email' => $request->string('email')->toString(),
                'phone' => $request->string('phone')->toString(),
                'country_city' => $request->string('country_city')->toString(),
                'organization' => $request->string('organization')->toString(),
                'job_title' => $request->string('job_title')->toString(),
                'experience' => $request->string('experience')->toString(),
                'reason' => $request->string('reason')->toString(),
                'answers' => $request->snapshotAnswers($course),
                'consent_accepted_at' => now(),
                'status' => TrainingRegistrationStatus::Pending,
            ]);
        });

        if (! $registration instanceof TrainingRegistration) {
            return back()
                ->withErrors(['course' => __('Registration is closed for this course.')])
                ->withInput();
        }

        $registration->load('course');

        $this->notifyParticipants($registration);

        return to_route('training.registrations.confirmation', [
            'trainingRegistration' => $registration->public_token,
        ]);
    }

    public function confirmation(TrainingRegistration $trainingRegistration): Response
    {
        $trainingRegistration->load('course');

        return Inertia::render('frontend/training-registration-confirmation', [
            'registration' => [
                'number' => $trainingRegistration->registration_number,
                'full_name' => $trainingRegistration->full_name,
                'email' => $trainingRegistration->email,
                'course_title' => $trainingRegistration->course?->title,
                'status' => $trainingRegistration->status?->value,
                'status_label' => $trainingRegistration->status?->label(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function courseCard(TrainingCourse $course): array
    {
        return [
            'title' => $course->title,
            'slug' => $course->slug,
            'dates' => $this->dateRange($course),
            'duration' => $course->duration,
            'location' => $course->location,
            'trainer' => $course->trainer,
            'available_seats' => $course->availableSeats(),
            'registration_deadline' => $course->registration_deadline?->format('M j, Y'),
            'registration_open' => $course->registrationIsOpen(),
            'description' => $course->description,
            'thumbnail_url' => $course->thumbnailUrl(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function courseDetail(TrainingCourse $course): array
    {
        return [
            ...$this->courseCard($course),
            'description' => $course->description,
            'questions' => $course->normalizedQuestions(),
        ];
    }

    private function dateRange(TrainingCourse $course): string
    {
        $start = $course->starts_on?->format('M j, Y') ?? '';
        $end = $course->ends_on?->format('M j, Y');

        if ($end === null || $end === $start) {
            return $start;
        }

        return $start.' – '.$end;
    }

    private function notifyParticipants(TrainingRegistration $registration): void
    {
        $courseTitle = (string) $registration->course?->title;
        $adminUrl = route('admin.training.registrations.show', $registration);

        Notification::route('mail', $registration->email)
            ->notify(new TrainingRegistrationConfirmedNotification(
                $registration->registration_number,
                $courseTitle,
                $registration->full_name,
            ));

        $admins = User::query()
            ->where(function ($query): void {
                $query->where('role', UserRole::SuperAdmin)
                    ->orWhereHas('permissions', function ($permissions): void {
                        $permissions->where('name', PermissionName::ManageCms->value);
                    })
                    ->orWhereHas('roles.permissions', function ($permissions): void {
                        $permissions->where('name', PermissionName::ManageCms->value);
                    });
            })
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        Notification::send(
            $admins,
            new TrainingRegistrationReceivedNotification(
                $registration->registration_number,
                $courseTitle,
                $registration->full_name,
                $adminUrl,
            ),
        );
    }
}
