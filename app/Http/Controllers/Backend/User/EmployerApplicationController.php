<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployerApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $appsQuery = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $request->user()?->id))
            ->with(['jobSeeker:id,name,email', 'jobPost:id,title'])
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

        $applications = $appsQuery->get()->map(fn (JobApplication $application) => [
            'id' => $application->id,
            'name' => $application->jobSeeker?->name,
            'email' => $application->jobSeeker?->email,
            'job' => $application->jobPost?->title,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'date' => $application->created_at?->toDateString(),
        ]);

        return Inertia::render('backend/User/EmployerApplications', [
            'applications' => $applications,
            'filters' => ['status' => $status, 'search' => $search],
            'stats' => [
                'total' => $applications->count(),
                'new' => $applications->where('status_value', JobApplicationStatus::Applied->value)->count(),
                'interview' => $applications->where('status_value', JobApplicationStatus::Interview->value)->count(),
                'hired' => $applications->where('status_value', JobApplicationStatus::Hired->value)->count(),
            ],
            'statuses' => collect(JobApplicationStatus::cases())->map(fn (JobApplicationStatus $item) => [
                'value' => $item->value,
                'label' => $item->label(),
            ]),
        ]);
    }

    public function update(Request $request, JobApplication $application): RedirectResponse
    {
        $application->loadMissing('jobPost');

        abort_unless($application->jobPost?->employer_id === $request->user()?->id, 403);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(collect(JobApplicationStatus::cases())->map->value->all())],
        ]);

        $application->forceFill(['status' => JobApplicationStatus::from($validated['status'])])->save();

        return back()->with('success', 'Application updated.');
    }
}
