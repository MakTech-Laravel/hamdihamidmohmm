<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\GeneratedReport;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canViewAnalytics(), 403);

        $reports = GeneratedReport::query()
            ->with('generator:id,name')
            ->latest()
            ->get()
            ->map(fn (GeneratedReport $report) => [
                'id' => $report->id,
                'name' => $report->name,
                'module' => $report->module,
                'format' => $report->format,
                'generated_at' => $report->generated_at?->toDayDateTimeString(),
                'generated_by' => $report->generator?->name,
            ]);

        return Inertia::render('backend/Admin/ReportsAnalytics', [
            'reports' => $reports,
            'modules' => ['users', 'employers', 'job_seekers', 'jobs', 'applications', 'payments'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->canViewAnalytics(), 403);

        $module = $request->string('module')->toString();
        abort_unless(in_array($module, ['users', 'employers', 'job_seekers', 'jobs', 'applications', 'payments'], true), 422);

        $filename = $module.'-'.now()->format('Y-m-d-His').'.csv';
        $path = 'reports/'.$filename;

        Storage::disk('local')->put($path, $this->csv($module));

        GeneratedReport::query()->create([
            'name' => ucfirst(str_replace('_', ' ', $module)).' export',
            'module' => $module,
            'format' => 'csv',
            'path' => $path,
            'generated_by' => $request->user()?->id,
            'generated_at' => now(),
        ]);

        return back()->with('success', 'Report generated.');
    }

    public function download(Request $request, GeneratedReport $generatedReport): StreamedResponse
    {
        abort_unless($request->user()?->canViewAnalytics(), 403);

        return Storage::disk('local')->download($generatedReport->path, basename($generatedReport->path), [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function destroy(Request $request, GeneratedReport $generatedReport): RedirectResponse
    {
        abort_unless($request->user()?->canViewAnalytics(), 403);

        Storage::disk('local')->delete($generatedReport->path);
        $generatedReport->delete();

        return back()->with('success', 'Report deleted.');
    }

    private function csv(string $module): string
    {
        $handle = fopen('php://temp', 'r+');

        if ($handle === false) {
            return '';
        }

        match ($module) {
            'employers' => $this->writeEmployers($handle),
            'job_seekers' => $this->writeSeekers($handle),
            'jobs' => $this->writeJobs($handle),
            'applications' => $this->writeApplications($handle),
            'payments' => $this->writePayments($handle),
            default => $this->writeUsers($handle),
        };

        rewind($handle);
        $csv = stream_get_contents($handle) ?: '';
        fclose($handle);

        return $csv;
    }

    /**
     * @param  resource  $handle
     */
    private function writeUsers($handle): void
    {
        fputcsv($handle, ['Name', 'Email', 'Role']);
        User::query()->each(fn (User $user) => fputcsv($handle, [$user->name, $user->email, $user->role_label]));
    }

    /**
     * @param  resource  $handle
     */
    private function writeEmployers($handle): void
    {
        fputcsv($handle, ['Company', 'Email', 'Status']);
        User::query()->where('role', UserRole::Employer)->each(fn (User $user) => fputcsv($handle, [$user->company_name, $user->email, $user->account_status?->label()]));
    }

    /**
     * @param  resource  $handle
     */
    private function writeSeekers($handle): void
    {
        fputcsv($handle, ['Name', 'Email', 'Location']);
        User::query()->where('role', UserRole::JobSeeker)->each(fn (User $user) => fputcsv($handle, [$user->name, $user->email, $user->location]));
    }

    /**
     * @param  resource  $handle
     */
    private function writeJobs($handle): void
    {
        fputcsv($handle, ['Title', 'Status', 'Location']);
        JobPost::query()->each(fn (JobPost $job) => fputcsv($handle, [$job->title, $job->effectiveStatus()->label(), $job->location]));
    }

    /**
     * @param  resource  $handle
     */
    private function writeApplications($handle): void
    {
        fputcsv($handle, ['ID', 'Status']);
        JobApplication::query()->each(fn (JobApplication $application) => fputcsv($handle, [$application->id, $application->status?->label()]));
    }

    /**
     * @param  resource  $handle
     */
    private function writePayments($handle): void
    {
        fputcsv($handle, ['Reference', 'Amount', 'Status']);
        Payment::query()->each(fn (Payment $payment) => fputcsv($handle, [$payment->reference, $payment->amount, $payment->status?->label()]));
    }
}
