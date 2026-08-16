<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreEmployerJobRequest;
use App\Http\Requests\Backend\User\UpdateEmployerJobRequest;
use App\Models\JobPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerJobController extends Controller
{
    public function index(Request $request): Response
    {
        $jobs = JobPost::query()
            ->where('employer_id', $request->user()?->id)
            ->withCount('applications')
            ->latest()
            ->get()
            ->map(fn (JobPost $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'location' => $job->location,
                'type' => $job->employment_type,
                'status' => $job->effectiveStatus()->label(),
                'status_value' => $job->effectiveStatus()->value,
                'applications' => $job->applications_count,
                'expires_at' => $job->expires_at?->toDateString(),
                'created_at' => $job->created_at?->toDateString(),
            ]);

        return Inertia::render('backend/User/EmployerJobs', [
            'jobs' => $jobs,
            'stats' => [
                'total' => $jobs->count(),
                'active' => $jobs->where('status_value', JobPostStatus::Active->value)->count(),
                'pending' => $jobs->where('status_value', JobPostStatus::Pending->value)->count(),
                'expired' => $jobs->where('status_value', JobPostStatus::Expired->value)->count(),
            ],
        ]);
    }

    public function store(StoreEmployerJobRequest $request): RedirectResponse
    {
        JobPost::query()->create([
            ...$request->validated(),
            'employer_id' => $request->user()?->id,
            'status' => JobPostStatus::Pending,
            'expires_at' => $request->date('expires_at') ?? now()->addDays(30),
        ]);

        return back()->with('success', 'Job submitted for review.');
    }

    public function update(UpdateEmployerJobRequest $request, JobPost $job): RedirectResponse
    {
        $job->update($request->validated());

        if ($job->status === JobPostStatus::Rejected) {
            $job->forceFill(['status' => JobPostStatus::Pending, 'rejection_reason' => null])->save();
        }

        return back()->with('success', 'Job updated.');
    }

    public function destroy(Request $request, JobPost $job): RedirectResponse
    {
        abort_unless($job->employer_id === $request->user()?->id, 403);

        $job->delete();

        return back()->with('success', 'Job deleted.');
    }
}
