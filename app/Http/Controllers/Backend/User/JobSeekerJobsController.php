<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use App\Support\PortalPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerJobsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $search = $request->string('search')->toString();

        $appliedJobIds = JobApplication::query()
            ->where('job_seeker_id', $user?->id)
            ->pluck('job_post_id')
            ->all();

        $jobs = JobPost::query()
            ->active()
            ->with('employer:id,name,company_name,portal_preferences')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($builder) use ($search): void {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhereHas('employer', function ($employer) use ($search): void {
                            $employer->where('company_name', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(function (JobPost $job) use ($appliedJobIds) {
                $company = $job->employer?->company_name ?: $job->employer?->name;

                return [
                    'id' => $job->id,
                    'slug' => $job->slug,
                    'title' => $job->title,
                    'company' => $company,
                    'initials' => $this->initials($company),
                    'location' => $job->location,
                    'type' => $job->employment_type,
                    'category' => $job->category,
                    'salary' => $this->publicSalary($job->employer, $job->salary_range),
                    'applied' => in_array($job->id, $appliedJobIds, true),
                    'job_url' => $job->slug ? route('jobs.show', $job->slug) : null,
                ];
            });

        return Inertia::render('backend/User/JobSeekerJobs', [
            'jobs' => $jobs,
            'filters' => ['search' => $search],
        ]);
    }

    private function publicSalary(?User $employer, ?string $salary): ?string
    {
        if ($employer === null || ! filled($salary)) {
            return $salary;
        }

        $prefs = PortalPreferences::for($employer);

        return $prefs['privacy']['show_salary'] ? $salary : null;
    }

    private function initials(?string $name): string
    {
        $letters = preg_replace('/[^A-Za-z]/', '', (string) $name) ?: 'JP';

        return Str::upper(Str::substr($letters, 0, 2));
    }
}
