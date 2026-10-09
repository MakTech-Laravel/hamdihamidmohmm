<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\TrainingRegistrationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateTrainingRegistrationStatusRequest;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TrainingRegistrationController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageCms() === true, 403);

        $registrations = $this->filteredQuery($request)
            ->latest()
            ->get()
            ->map(fn (TrainingRegistration $registration): array => [
                'id' => $registration->id,
                'number' => $registration->registration_number,
                'full_name' => $registration->full_name,
                'email' => $registration->email,
                'course' => $registration->course?->title,
                'status' => $registration->status?->value,
                'status_label' => $registration->status?->label(),
                'created_at' => $registration->created_at?->format('M j, Y'),
            ]);

        return Inertia::render('backend/Admin/TrainingRegistrations', [
            'registrations' => $registrations,
            'filters' => $this->filters($request),
            'courses' => $this->courseOptions(),
            'statuses' => $this->statusOptions(),
        ]);
    }

    public function show(Request $request, TrainingRegistration $trainingRegistration): Response
    {
        abort_unless($request->user()?->canManageCms() === true, 403);

        $trainingRegistration->load('course');

        return Inertia::render('backend/Admin/TrainingRegistrationShow', [
            'registration' => [
                'id' => $trainingRegistration->id,
                'number' => $trainingRegistration->registration_number,
                'full_name' => $trainingRegistration->full_name,
                'email' => $trainingRegistration->email,
                'phone' => $trainingRegistration->phone,
                'country_city' => $trainingRegistration->country_city,
                'organization' => $trainingRegistration->organization,
                'job_title' => $trainingRegistration->job_title,
                'experience' => $trainingRegistration->experience,
                'reason' => $trainingRegistration->reason,
                'answers' => $trainingRegistration->answers ?? [],
                'status' => $trainingRegistration->status?->value,
                'status_label' => $trainingRegistration->status?->label(),
                'course' => $trainingRegistration->course?->title,
                'consent_accepted_at' => $trainingRegistration->consent_accepted_at?->format('M j, Y g:i A'),
                'created_at' => $trainingRegistration->created_at?->format('M j, Y g:i A'),
            ],
            'statuses' => $this->statusOptions(),
        ]);
    }

    public function update(UpdateTrainingRegistrationStatusRequest $request, TrainingRegistration $trainingRegistration): RedirectResponse
    {
        $next = TrainingRegistrationStatus::from($request->string('status')->toString());
        $current = $trainingRegistration->status;

        if ($next->occupiesSeat() && $current instanceof TrainingRegistrationStatus && ! $current->occupiesSeat()) {
            $course = $trainingRegistration->course()->first();

            if ($course instanceof TrainingCourse) {
                $occupied = $course->registrations()
                    ->whereIn('status', TrainingRegistrationStatus::occupyingValues())
                    ->count();

                if ($occupied >= $course->seats) {
                    return back()->withErrors([
                        'status' => __('This course has no seats left for that status.'),
                    ]);
                }
            }
        }

        $trainingRegistration->update([
            'status' => $next,
        ]);

        return back()->with('success', 'Registration status updated.');
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->canManageCms() === true, 403);

        $registrations = $this->filteredQuery($request)->latest()->get();
        $courseFilter = $request->integer('course');
        $extraLabels = [];

        if ($courseFilter > 0) {
            foreach ($registrations as $registration) {
                foreach ($registration->answers ?? [] as $answer) {
                    if (! is_array($answer)) {
                        continue;
                    }

                    $label = trim((string) ($answer['label'] ?? ''));

                    if ($label !== '') {
                        $extraLabels[$label] = $label;
                    }
                }
            }
        }

        $filename = 'training-registrations-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($registrations, $courseFilter, $extraLabels): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            $headers = [
                'Registration number',
                'Course',
                'Full name',
                'Email',
                'Phone',
                'Country/City',
                'Organization',
                'Job title',
                'Experience',
                'Reason',
                'Status',
                'Submitted',
            ];

            if ($courseFilter > 0) {
                foreach ($extraLabels as $label) {
                    $headers[] = $label;
                }
            } else {
                $headers[] = 'Additional answers';
            }

            fputcsv($handle, $headers);

            foreach ($registrations as $registration) {
                $row = [
                    $registration->registration_number,
                    $registration->course?->title,
                    $registration->full_name,
                    $registration->email,
                    $registration->phone,
                    $registration->country_city,
                    $registration->organization,
                    $registration->job_title,
                    $registration->experience,
                    $registration->reason,
                    $registration->status?->label(),
                    $registration->created_at?->format('Y-m-d H:i'),
                ];

                $answers = collect($registration->answers ?? [])
                    ->filter(fn (mixed $answer): bool => is_array($answer));

                if ($courseFilter > 0) {
                    foreach ($extraLabels as $label) {
                        $match = $answers->first(fn (array $answer): bool => ($answer['label'] ?? '') === $label);
                        $row[] = is_array($match) ? (string) ($match['value'] ?? '') : '';
                    }
                } else {
                    $row[] = $answers
                        ->map(fn (array $answer): string => trim((string) ($answer['label'] ?? '')).': '.trim((string) ($answer['value'] ?? '')))
                        ->filter(fn (string $line): bool => $line !== ':')
                        ->implode(' | ');
                }

                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @return Builder<TrainingRegistration>
     */
    private function filteredQuery(Request $request): Builder
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();
        $courseId = $request->integer('course');

        return TrainingRegistration::query()
            ->with('course')
            ->when($courseId > 0, fn (Builder $query) => $query->where('training_course_id', $courseId))
            ->when(
                $status !== '' && TrainingRegistrationStatus::tryFrom($status) instanceof TrainingRegistrationStatus,
                fn (Builder $query) => $query->where('status', $status),
            )
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $inner) use ($search): void {
                    $inner->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('registration_number', 'like', "%{$search}%");
                });
            });
    }

    /**
     * @return array{course: int, status: string, search: string}
     */
    private function filters(Request $request): array
    {
        return [
            'course' => $request->integer('course'),
            'status' => $request->string('status')->toString(),
            'search' => $request->string('search')->toString(),
        ];
    }

    /**
     * @return list<array{id: int, title: string}>
     */
    private function courseOptions(): array
    {
        return TrainingCourse::query()
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn (TrainingCourse $course): array => [
                'id' => $course->id,
                'title' => $course->title,
            ])
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return collect(TrainingRegistrationStatus::cases())
            ->map(fn (TrainingRegistrationStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ])
            ->values()
            ->all();
    }
}
