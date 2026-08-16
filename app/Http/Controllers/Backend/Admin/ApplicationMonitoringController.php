<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationMonitoringController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $status = $request->string('status')->toString();

        $appsQuery = JobApplication::query()
            ->with(['jobPost:id,title,employer_id', 'jobPost.employer:id,name,company_name', 'jobSeeker:id,name,email'])
            ->latest();

        if (JobApplicationStatus::tryFrom($status) instanceof JobApplicationStatus) {
            $appsQuery->where('status', $status);
        }

        $applications = $appsQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (JobApplication $application) => $this->row($application));

        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->startOfDay()->subDays($i);
            $trend[] = [
                'label' => $day->format('D'),
                'count' => JobApplication::query()->whereDate('created_at', $day->toDateString())->count(),
            ];
        }

        return Inertia::render('backend/Admin/ApplicationsMonitoring', [
            'applications' => $applications,
            'filters' => ['status' => $status],
            'stats' => $this->stats(),
            'trend' => $trend,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $filename = 'applications-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Seeker', 'Email', 'Job', 'Employer', 'Status', 'Applied']);

            JobApplication::query()->with(['jobSeeker', 'jobPost.employer'])->latest()->each(function (JobApplication $application) use ($handle): void {
                fputcsv($handle, [
                    $application->jobSeeker?->name,
                    $application->jobSeeker?->email,
                    $application->jobPost?->title,
                    $application->jobPost?->employer?->company_name,
                    $application->status?->label(),
                    $application->created_at?->toDateString(),
                ]);
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(JobApplication $application): array
    {
        return [
            'id' => $application->id,
            'seeker' => $application->jobSeeker?->name,
            'email' => $application->jobSeeker?->email,
            'job' => $application->jobPost?->title,
            'employer' => $application->jobPost?->employer?->company_name ?: $application->jobPost?->employer?->name,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            'date' => $application->created_at?->toDateString(),
        ];
    }

    /**
     * @return array{total: int, today: int, interviews: int, hired: int}
     */
    private function stats(): array
    {
        return [
            'total' => JobApplication::query()->count(),
            'today' => JobApplication::query()->whereDate('created_at', today())->count(),
            'interviews' => JobApplication::query()->where('status', JobApplicationStatus::Interview)->count(),
            'hired' => JobApplication::query()->where('status', JobApplicationStatus::Hired)->count(),
        ];
    }
}
