<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetMyApplications implements Tool
{
    use EncodesToolResults;

    public function __construct(public User $user) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get the signed-in job seeker\'s own job applications (job, company, status, date) '
            .'and how many CVs / resumes they have uploaded.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $applications = $this->user->jobApplications()
            ->with('jobPost:id,title,slug,employer_id', 'jobPost.employer:id,name,company_name')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (JobApplication $application): array => [
                'job' => $application->jobPost?->title,
                'company' => $application->jobPost?->employer?->company_name ?: $application->jobPost?->employer?->name,
                'status' => $application->status?->label(),
                'applied_on' => $application->created_at?->toDateString(),
            ])
            ->values()
            ->all();

        return $this->encode([
            'total_applications' => $this->user->jobApplications()->count(),
            'recent_applications' => $applications,
            'uploaded_cvs' => $this->user->jobSeekerCvs()->count(),
            'applications_url' => route('job-seeker.applications', absolute: false),
            'profile_url' => route('job-seeker.profile', absolute: false),
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
