<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\JobPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\RejectJobPostRequest;
use App\Models\JobPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $statusFilter = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $jobsQuery = JobPost::query()->with(['employer:id,name,company_name'])->withCount('applications')->latest();

        $status = JobPostStatus::fromFilter($statusFilter);

        if ($status instanceof JobPostStatus) {
            if ($status === JobPostStatus::Expired) {
                $jobsQuery->where(function ($query): void {
                    $query->where('status', JobPostStatus::Expired)
                        ->orWhere(function ($expired): void {
                            $expired->where('status', JobPostStatus::Active)
                                ->whereNotNull('expires_at')
                                ->where('expires_at', '<', now());
                        });
                });
            } else {
                $jobsQuery->where('status', $status);
            }
        }

        if ($search !== '') {
            $jobsQuery->where(function ($query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('employer', function ($employer) use ($search): void {
                        $employer->where('company_name', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        $jobs = $jobsQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (JobPost $job) => $this->row($job));

        return Inertia::render('backend/Admin/JobManagement', [
            'jobs' => $jobs,
            'filters' => ['status' => $statusFilter, 'search' => $search],
            'stats' => $this->stats(),
        ]);
    }

    public function show(Request $request, JobPost $jobPost): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobPost->load(['employer:id,name,company_name,email'])->loadCount('applications');

        return Inertia::render('backend/Admin/JobShow', [
            'job' => [
                ...$this->row($jobPost),
                'description' => $jobPost->description,
                'employment_type' => $jobPost->employment_type,
                'salary_range' => $jobPost->salary_range,
                'rejection_reason' => $jobPost->rejection_reason,
                'expires_at' => $jobPost->expires_at?->toDateString(),
                'employer_email' => $jobPost->employer?->email,
            ],
        ]);
    }

    public function approve(Request $request, JobPost $jobPost): RedirectResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobPost->forceFill([
            'status' => JobPostStatus::Active,
            'rejection_reason' => null,
        ])->save();

        return back()->with('success', 'Job approved.');
    }

    public function reject(RejectJobPostRequest $request, JobPost $jobPost): RedirectResponse
    {
        $jobPost->forceFill([
            'status' => JobPostStatus::Rejected,
            'rejection_reason' => $request->string('rejection_reason')->toString(),
        ])->save();

        return back()->with('success', 'Job rejected.');
    }

    public function feature(Request $request, JobPost $jobPost): RedirectResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobPost->forceFill(['featured' => ! $jobPost->featured])->save();

        return back()->with('success', $jobPost->featured ? 'Job featured.' : 'Feature removed.');
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $filename = 'jobs-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Title', 'Employer', 'Category', 'Location', 'Status', 'Applications', 'Views', 'Created']);

            JobPost::query()->with('employer')->withCount('applications')->latest()->each(function (JobPost $job) use ($handle): void {
                fputcsv($handle, [
                    $job->title,
                    $job->employer?->company_name ?: $job->employer?->name,
                    $job->category,
                    $job->location,
                    $job->effectiveStatus()->label(),
                    $job->applications_count,
                    $job->views,
                    $job->created_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobPost $job): array
    {
        $status = $job->effectiveStatus();

        return [
            'id' => $job->id,
            'title' => $job->title,
            'slug' => $job->slug,
            'employer' => $job->employer?->company_name ?: $job->employer?->name,
            'category' => $job->category ?: '—',
            'location' => $job->location ?: '—',
            'applications' => $job->applications_count ?? $job->applications()->count(),
            'views' => $job->views,
            'status' => $status->label(),
            'status_value' => $status->value,
            'featured' => $job->featured,
            'created' => $job->created_at?->toDateString(),
            'can_review' => $job->status === JobPostStatus::Pending,
        ];
    }

    /**
     * @return array{total: int, active: int, pending: int, rejected: int, expired: int, featured: int}
     */
    private function stats(): array
    {
        return [
            'total' => JobPost::query()->count(),
            'active' => JobPost::query()->active()->count(),
            'pending' => JobPost::query()->where('status', JobPostStatus::Pending)->count(),
            'rejected' => JobPost::query()->where('status', JobPostStatus::Rejected)->count(),
            'expired' => JobPost::query()
                ->where(function ($query): void {
                    $query->where('status', JobPostStatus::Expired)
                        ->orWhere(function ($expired): void {
                            $expired->where('status', JobPostStatus::Active)
                                ->whereNotNull('expires_at')
                                ->where('expires_at', '<', now());
                        });
                })
                ->count(),
            'featured' => JobPost::query()->where('featured', true)->count(),
        ];
    }
}
