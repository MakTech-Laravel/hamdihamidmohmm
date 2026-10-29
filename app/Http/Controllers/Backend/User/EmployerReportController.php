<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\JobPost;
use App\Support\EmployerJobAccess;
use App\Support\ListPageSize;
use App\Support\RecruitmentReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerReportController extends Controller
{
    public function index(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);

        $jobs = EmployerJobAccess::constrainJobQuery(JobPost::query(), $employer)
            ->withCount([
                'applications as total_applications_count',
                'applications as shortlisted_count' => fn ($query) => $query->where('status', JobApplicationStatus::Shortlisted),
                'applications as interview_count' => fn ($query) => $query->where('status', JobApplicationStatus::Interview),
                'applications as hired_count' => fn ($query) => $query->where('status', JobApplicationStatus::Hired),
                'applications as rejected_count' => fn ($query) => $query->where('status', JobApplicationStatus::Rejected),
            ])
            ->latest()
            ->paginate(ListPageSize::DEFAULT)
            ->withQueryString()
            ->through(fn (JobPost $job): array => [
                'id' => $job->id,
                'reference' => RecruitmentReport::jobReference($job),
                'title' => $job->title,
                'status' => $job->status?->label() ?? '',
                'status_value' => $job->status?->value ?? '',
                'expires_at' => $job->expires_at?->toDateString(),
                'total' => (int) $job->total_applications_count,
                'shortlisted' => (int) $job->shortlisted_count,
                'interview' => (int) $job->interview_count,
                'hired' => (int) $job->hired_count,
                'rejected' => (int) $job->rejected_count,
                'export_url' => route('employer.applications.export', ['job_id' => $job->id]),
                'applications_url' => route('employer.applications', ['job_id' => $job->id]),
            ]);

        return Inertia::render('backend/User/EmployerReports', [
            'jobs' => $jobs,
        ]);
    }
}
