<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateEmployerApplicationRequest;
use App\Models\JobApplication;
use App\Models\User;
use App\Support\JobSeekerResume;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $appsQuery = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $request->user()?->id))
            ->with([
                'jobSeeker:id,name,email,phone,location',
                'jobSeeker.jobSeekerProfile:id,user_id,experience,headline,skills',
                'jobPost:id,title',
            ])
            ->latest();

        if (JobApplicationStatus::tryFrom($status) instanceof JobApplicationStatus) {
            $appsQuery->where('status', $status);
        }

        if ($search !== '') {
            $appsQuery->whereHas('jobSeeker', function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $applications = $appsQuery->get()->map(fn (JobApplication $application) => $this->row($application));

        $allForStats = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $request->user()?->id));

        return Inertia::render('backend/User/EmployerApplications', [
            'applications' => $applications,
            'filters' => ['status' => $status, 'search' => $search],
            'stats' => [
                'total' => (clone $allForStats)->count(),
                'new' => (clone $allForStats)->where('created_at', '>=', now()->startOfWeek())->count(),
                'shortlisted' => (clone $allForStats)->where('status', JobApplicationStatus::Shortlisted)->count(),
                'interview' => (clone $allForStats)->where('status', JobApplicationStatus::Interview)->count(),
            ],
            'statuses' => collect(JobApplicationStatus::cases())
                ->reject(fn (JobApplicationStatus $item) => $item === JobApplicationStatus::Withdrawn)
                ->map(fn (JobApplicationStatus $item) => [
                    'value' => $item->value,
                    'label' => $item->label(),
                ])
                ->values(),
        ]);
    }

    public function update(UpdateEmployerApplicationRequest $request, JobApplication $application): RedirectResponse
    {
        $application->forceFill([
            'status' => JobApplicationStatus::from($request->validated('status')),
        ])->save();

        return back()->with('success', 'Application updated.');
    }

    public function downloadResume(Request $request, JobApplication $application): StreamedResponse
    {
        abort_unless($request->user()?->isEmployer() === true, 403);

        $application->loadMissing(['jobPost', 'jobSeeker.jobSeekerProfile']);

        abort_unless($application->jobPost?->employer_id === $request->user()?->id, 403);

        $seeker = $application->jobSeeker;
        abort_unless($seeker instanceof User, 404);

        if (filled($application->resume_path) && Storage::disk('local')->exists($application->resume_path)) {
            $downloadName = $application->resume_original_name ?: basename($application->resume_path);

            return Storage::disk('local')->download($application->resume_path, $downloadName);
        }

        return response()->streamDownload(function () use ($seeker): void {
            echo JobSeekerResume::pdf($seeker);
        }, JobSeekerResume::filename($seeker), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobApplication $application): array
    {
        $next = $application->status?->next();
        $seeker = $application->jobSeeker;
        $profile = $seeker?->jobSeekerProfile;
        $skills = is_array($profile?->skills) ? $profile->skills : [];
        $experience = $profile?->experienceLabel() ?? '—';
        $location = $seeker?->location ?: '—';

        return [
            'id' => $application->id,
            'name' => $seeker?->name,
            'email' => $seeker?->email,
            'phone' => $seeker?->phone ?: '—',
            'location' => $location,
            'job' => $application->jobPost?->title,
            'job_id' => $application->job_post_id,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'date' => $application->created_at?->format('M j, Y'),
            'experience' => $experience,
            'cover_letter' => $application->cover_letter,
            'headline' => $profile?->headline,
            'skills' => array_values(array_filter(
                $skills,
                fn (mixed $skill): bool => is_string($skill) && $skill !== '',
            )),
            'resume_url' => route('employer.applications.resume', $application),
            'timeline' => $this->formatTimeline($application->timeline()),
            'preview_location' => $this->previewLocation($location, $experience),
            'next_status' => $next?->value,
            'can_move' => $next instanceof JobApplicationStatus,
            'can_reject' => $application->status !== JobApplicationStatus::Withdrawn
                && $application->status !== JobApplicationStatus::Rejected,
        ];
    }

    /**
     * @param  list<array{label: string, date: string|null, state: string}>  $steps
     * @return list<array{label: string, date: string|null, state: string}>
     */
    private function formatTimeline(array $steps): array
    {
        return array_map(function (array $step): array {
            return [
                'label' => $step['label'],
                'date' => $step['date'] !== null
                    ? Carbon::parse($step['date'])->format('M j')
                    : null,
                'state' => $step['state'],
            ];
        }, $steps);
    }

    private function previewLocation(string $location, string $experience): string
    {
        if ($experience === '—' || $experience === '') {
            return $location;
        }

        if ($location === '—') {
            return $experience;
        }

        return $location.' · '.$experience;
    }
}
