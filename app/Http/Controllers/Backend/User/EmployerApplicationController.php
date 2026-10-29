<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Enums\Gender;
use App\Enums\JobApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\BulkUpdateEmployerApplicationsRequest;
use App\Http\Requests\Backend\User\RescoreEmployerApplicationRequest;
use App\Http\Requests\Backend\User\RescoreEmployerJobApplicationsRequest;
use App\Http\Requests\Backend\User\UpdateEmployerApplicationRequest;
use App\Models\EmployerRosterEntry;
use App\Models\JobApplication;
use App\Models\JobApplicationStatusChange;
use App\Models\JobPost;
use App\Models\User;
use App\Services\Ats\ApplicationScreeningDispatcher;
use App\Services\Ats\AtsInputBuilder;
use App\Services\Ats\AtsSettings;
use App\Support\ApplicantDocumentDownloader;
use App\Support\ApplicantProfilePreview;
use App\Support\ApplicantQualification;
use App\Support\EmployerJobAccess;
use App\Support\ExperienceFilterOptions;
use App\Support\JobApplicationQuestions;
use App\Support\JobSeekerResume;
use App\Support\ListPageSize;
use App\Support\PortalNotifier;
use App\Support\RecruitmentReport;
use App\Support\XlsxWriter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerApplicationController extends Controller
{
    private const AI_BANDS = ['strong', 'possible', 'weak', 'pending', 'no_cv', 'failed', 'unreadable'];

    public function __construct(
        private AtsSettings $atsSettings,
        private AtsInputBuilder $atsInputBuilder,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $shortlist = $request->boolean('shortlist');

        if ($shortlist && $status === '') {
            $status = JobApplicationStatus::Shortlisted->value;
        }

        $search = $request->string('search')->toString();
        $jobId = $request->integer('job_id');
        $experience = $request->string('experience')->toString();
        $sort = $this->resolveSort($request);
        $direction = $this->resolveDirection($request);
        $gender = Gender::tryFrom($request->string('gender')->toString());
        $atsEnabled = $this->atsSettings->enabledForEmployer($request->user());
        $aiSort = $atsEnabled && in_array($request->string('ai_sort')->toString(), ['asc', 'desc'], true)
            ? $request->string('ai_sort')->toString()
            : '';
        $aiBand = $atsEnabled && in_array($request->string('ai_band')->toString(), self::AI_BANDS, true)
            ? $request->string('ai_band')->toString()
            : '';

        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $appsQuery = EmployerJobAccess::constrainApplicationQuery(JobApplication::query(), $employer)
            ->with([
                'jobSeeker',
                'jobSeeker.jobSeekerProfile',
                'jobPost:id,title,application_questions',
                'statusChanges.changedBy:id,name',
            ]);

        if ($jobId > 0) {
            $appsQuery->where('job_post_id', $jobId);
        }

        if (JobApplicationStatus::tryFrom($status) instanceof JobApplicationStatus) {
            $appsQuery->where('status', $status);
        }

        if ($search !== '') {
            $appsQuery->where(function (Builder $query) use ($search): void {
                $query->whereHas('jobSeeker', function (Builder $seekerQuery) use ($search): void {
                    $seekerQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('jobPost', function (Builder $jobQuery) use ($search): void {
                    $jobQuery->where('title', 'like', "%{$search}%");
                });
            });
        }

        if ($gender instanceof Gender) {
            $appsQuery->whereHas('jobSeeker.jobSeekerProfile', function ($query) use ($gender): void {
                $query->where('gender', $gender->value);
            });
        }

        ExperienceFilterOptions::applyRange($appsQuery, $experience);

        if ($aiBand !== '') {
            $this->applyAiBand($appsQuery, $aiBand);
        }

        if ($aiSort !== '') {
            $appsQuery->orderByRaw('ai_score IS NULL')->orderBy('ai_score', $aiSort)->latest();
        } else {
            $this->applyListSort($appsQuery, $sort, $direction);
        }

        $rosterEntryIds = EmployerRosterEntry::query()
            ->forAccount($employer->employerAccountId())
            ->where('added_by', $employer->id)
            ->pluck('id', 'job_seeker_id')
            ->mapWithKeys(fn (mixed $id, mixed $seekerId): array => [(int) $seekerId => (int) $id])
            ->all();

        $applications = $appsQuery->paginate(ListPageSize::DEFAULT)->withQueryString();
        $pageApplications = $applications->getCollection();
        $jobHashes = $atsEnabled
            ? $this->jobHashes($pageApplications->pluck('job_post_id')->unique()->all())
            : [];
        $applications->setCollection(
            $pageApplications
                ->map(fn (JobApplication $application): array => $this->row(
                    $application,
                    $atsEnabled,
                    $jobHashes,
                    $rosterEntryIds,
                ))
                ->values(),
        );

        $allForStats = EmployerJobAccess::constrainApplicationQuery(JobApplication::query(), $employer);

        if ($jobId > 0) {
            $allForStats->where('job_post_id', $jobId);
        }

        $jobTitle = null;

        if ($jobId > 0) {
            $jobTitle = EmployerJobAccess::constrainJobQuery(JobPost::query(), $employer)
                ->whereKey($jobId)
                ->value('title');
        }

        return Inertia::render('backend/User/EmployerApplications', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'job_id' => $jobId > 0 ? $jobId : null,
                'job_title' => $jobTitle,
                'experience' => $experience,
                'sort' => $sort,
                'direction' => $direction,
                'gender' => $gender?->value ?? '',
                'shortlist' => $shortlist,
                'ai_sort' => $aiSort,
                'ai_band' => $aiBand,
            ],
            'ats' => $this->atsProps($request, $atsEnabled, $jobId, clone $allForStats),
            'experience_options' => ExperienceFilterOptions::enabled(),
            'gender_options' => Gender::options(),
            'stats' => [
                'total' => (clone $allForStats)->count(),
                'new' => (clone $allForStats)->where('created_at', '>=', now()->startOfWeek())->count(),
                'shortlisted' => (clone $allForStats)->where('status', JobApplicationStatus::Shortlisted)->count(),
                'interview' => (clone $allForStats)->where('status', JobApplicationStatus::Interview)->count(),
            ],
            'status_counts' => $this->statusCounts($allForStats),
            'gender_stats' => $this->genderStats($allForStats),
            'statuses' => collect(JobApplicationStatus::cases())
                ->reject(fn (JobApplicationStatus $item) => $item === JobApplicationStatus::Withdrawn)
                ->map(fn (JobApplicationStatus $item) => [
                    'value' => $item->value,
                    'label' => $item->label(),
                ])
                ->values(),
            'roster_categories' => EmployerRosterEntry::categoriesForAccount(
                $employer->employerAccountId(),
            ),
            'is_owner' => $employer->isEmployerOwner(),
        ]);
    }

    public function update(UpdateEmployerApplicationRequest $request, JobApplication $application): RedirectResponse
    {
        $this->applyStatus(
            $application,
            JobApplicationStatus::from($request->validated('status')),
            $request->user(),
        );

        return back()->with('success', 'Application updated.');
    }

    public function bulkUpdate(BulkUpdateEmployerApplicationsRequest $request): RedirectResponse
    {
        $status = JobApplicationStatus::from($request->validated('status'));
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $applications = EmployerJobAccess::constrainApplicationQuery(JobApplication::query(), $employer)
            ->whereIn('id', $request->validated('ids'))
            ->get();

        foreach ($applications as $application) {
            $this->applyStatus($application, $status, $employer);
        }

        return back()->with('success', 'Applications updated.');
    }

    public function export(Request $request): HttpResponse
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);

        $jobId = $request->integer('job_id');

        $applications = EmployerJobAccess::constrainApplicationQuery(JobApplication::query(), $employer)
            ->when($jobId > 0, fn ($query) => $query->where('job_post_id', $jobId))
            ->with(['jobSeeker.jobSeekerProfile', 'jobPost:id,title,expires_at'])
            ->latest()
            ->get();

        abort_if($jobId > 0 && $applications->isEmpty() && ! $this->employerOwnsJob($request, $jobId), 404);

        $suffix = $jobId > 0 ? 'JOB-'.str_pad((string) $jobId, 5, '0', STR_PAD_LEFT) : 'all-jobs';

        return response(
            XlsxWriter::build('Recruitment Report', RecruitmentReport::headings(), RecruitmentReport::rows($applications)),
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="recruitment-report-'.$suffix.'-'.now()->toDateString().'.xlsx"',
            ],
        );
    }

    public function rescore(
        RescoreEmployerApplicationRequest $request,
        JobApplication $application,
        ApplicationScreeningDispatcher $dispatcher,
    ): RedirectResponse {
        $queued = $dispatcher->dispatchOne($application, true);

        return back()->with(
            $queued ? 'success' : 'error',
            $queued ? 'AI re-score queued.' : 'This application has no CV to score.',
        );
    }

    public function rescoreJob(
        RescoreEmployerJobApplicationsRequest $request,
        JobPost $job,
        ApplicationScreeningDispatcher $dispatcher,
    ): RedirectResponse {
        $queued = $dispatcher->dispatchForJob($job, $request->validated('mode'));

        if ($queued === null) {
            return back()->with('error', 'A re-score is already running for this job. Please try again shortly.');
        }

        return back()->with('success', $queued === 0
            ? 'No applications needed re-scoring.'
            : "Queued {$queued} application(s) for AI scoring.");
    }

    public function downloadResume(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        $seeker = ApplicantDocumentDownloader::seekerFromApplication($application);

        if (filled($application->resume_path) && Storage::disk('local')->exists($application->resume_path)) {
            $downloadName = $application->resume_original_name ?: basename($application->resume_path);

            return Storage::disk('local')->download($application->resume_path, $downloadName);
        }

        if (filled($seeker->resume_path) && Storage::disk('local')->exists((string) $seeker->resume_path)) {
            $downloadName = $seeker->resume_original_name ?: basename((string) $seeker->resume_path);

            return Storage::disk('local')->download((string) $seeker->resume_path, $downloadName);
        }

        return response()->streamDownload(function () use ($seeker): void {
            echo JobSeekerResume::pdf($seeker);
        }, JobSeekerResume::filename($seeker), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function downloadHighestDegree(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::highestDegree(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadOtherDocument(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::otherDocument(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadCoverLetter(Request $request, JobApplication $application): StreamedResponse
    {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::coverLetter(
            ApplicantDocumentDownloader::seekerFromApplication($application),
        );
    }

    public function downloadCertification(
        Request $request,
        JobApplication $application,
        int $index,
        ?int $attachment = null,
    ): StreamedResponse {
        $this->authorizeEmployerApplication($request, $application);

        return ApplicantDocumentDownloader::certification(
            ApplicantDocumentDownloader::seekerFromApplication($application),
            $index,
            $attachment ?? 0,
        );
    }

    private function applyStatus(JobApplication $application, JobApplicationStatus $status, ?User $actor = null): void
    {
        $fromStatus = $application->status;

        $application->forceFill([
            'status' => $status,
        ])->save();

        if ($actor instanceof User && ($fromStatus === null || $fromStatus !== $status)) {
            JobApplicationStatusChange::query()->create([
                'job_application_id' => $application->id,
                'from_status' => $fromStatus?->value,
                'to_status' => $status->value,
                'changed_by' => $actor->id,
                'created_at' => now(),
            ]);
        }

        $application->loadMissing(['jobSeeker', 'jobPost.employer']);

        if ($application->jobSeeker instanceof User) {
            $company = $application->jobPost?->employer?->company_name
                ?: $application->jobPost?->employer?->name
                ?: 'the employer';

            PortalNotifier::applicationStatusChanged(
                $application->jobSeeker,
                (string) ($application->jobPost?->title ?? 'your application'),
                $status,
                $company,
            );
        }
    }

    private function employerOwnsJob(Request $request, int $jobId): bool
    {
        $user = $request->user();

        if ($user === null) {
            return false;
        }

        return EmployerJobAccess::constrainJobQuery(JobPost::query(), $user)
            ->whereKey($jobId)
            ->exists();
    }

    private function resolveSort(Request $request): string
    {
        $sort = $request->string('sort')->toString();

        if (in_array($sort, ['experience', 'qualification', 'certificates', 'gender'], true)) {
            return $sort;
        }

        return 'experience';
    }

    private function resolveDirection(Request $request): string
    {
        $legacy = $request->string('experience_sort')->toString();
        $direction = $request->string('direction')->toString();

        if (in_array($direction, ['asc', 'desc'], true)) {
            return $direction;
        }

        return in_array($legacy, ['asc', 'desc'], true) ? $legacy : 'desc';
    }

    /**
     * @param  Builder<JobApplication>  $query
     */
    private function applyListSort(Builder $query, string $sort, string $direction): void
    {
        $direction = $direction === 'asc' ? 'asc' : 'desc';

        if ($sort === 'experience') {
            ExperienceFilterOptions::applySort($query, $direction);

            return;
        }

        if ($sort === 'qualification') {
            $query->orderByRaw(
                "(SELECT COALESCE(job_seeker_profiles.qualification_rank, 0)
                  FROM job_seeker_profiles
                  WHERE job_seeker_profiles.user_id = job_applications.job_seeker_id
                  LIMIT 1) {$direction}"
            )->latest();

            return;
        }

        if ($sort === 'certificates') {
            $query->orderByRaw(
                "(SELECT COALESCE(job_seeker_profiles.certificate_count, 0)
                  FROM job_seeker_profiles
                  WHERE job_seeker_profiles.user_id = job_applications.job_seeker_id
                  LIMIT 1) {$direction}"
            )->latest();

            return;
        }

        $female = Gender::Female->value;
        $male = Gender::Male->value;

        $query->orderByRaw(
            "(SELECT CASE job_seeker_profiles.gender
                WHEN ? THEN 2
                WHEN ? THEN 1
                ELSE 0
              END
              FROM job_seeker_profiles
              WHERE job_seeker_profiles.user_id = job_applications.job_seeker_id
              LIMIT 1) {$direction}",
            [$female, $male],
        )->latest();
    }

    /**
     * @param  Builder<JobApplication>  $scope
     * @return array<string, int>
     */
    private function statusCounts(Builder $scope): array
    {
        $counts = (clone $scope)
            ->toBase()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return collect(JobApplicationStatus::cases())
            ->mapWithKeys(fn (JobApplicationStatus $status): array => [
                $status->value => (int) ($counts[$status->value] ?? 0),
            ])
            ->all();
    }

    /**
     * @param  Builder<JobApplication>  $scope
     * @return array{total: int, male: int, female: int, unspecified: int, male_percent: float, female_percent: float}
     */
    private function genderStats(Builder $scope): array
    {
        $total = (clone $scope)->count();

        $counts = (clone $scope)
            ->join('job_seeker_profiles', 'job_seeker_profiles.user_id', '=', 'job_applications.job_seeker_id')
            ->toBase()
            ->selectRaw('job_seeker_profiles.gender as gender, COUNT(*) as aggregate')
            ->groupBy('job_seeker_profiles.gender')
            ->pluck('aggregate', 'gender');

        $male = (int) ($counts[Gender::Male->value] ?? 0);
        $female = (int) ($counts[Gender::Female->value] ?? 0);
        $known = $male + $female;

        return [
            'total' => $total,
            'male' => $male,
            'female' => $female,
            'unspecified' => max($total - $known, 0),
            'male_percent' => $total > 0 ? round($male / $total * 100, 1) : 0.0,
            'female_percent' => $total > 0 ? round($female / $total * 100, 1) : 0.0,
        ];
    }

    private function authorizeEmployerApplication(Request $request, JobApplication $application): void
    {
        $user = $request->user();
        abort_unless($user?->isEmployer() === true, 403);

        $application->loadMissing(['jobPost']);

        abort_unless(
            $application->jobPost instanceof JobPost
            && EmployerJobAccess::canAccessJob($user, $application->jobPost),
            403,
        );
    }

    /**
     * @param  Builder<JobApplication>  $query
     */
    private function applyAiBand(Builder $query, string $band): void
    {
        $strong = $this->atsSettings->strongThreshold();
        $possible = $this->atsSettings->possibleThreshold();
        $completed = AtsScreeningStatus::Completed->value;

        match ($band) {
            'strong' => $query->where('ai_status', $completed)->where('ai_score', '>=', $strong),
            'possible' => $query->where('ai_status', $completed)->where('ai_score', '>=', $possible)->where('ai_score', '<', $strong),
            'weak' => $query->where('ai_status', $completed)->where('ai_score', '<', $possible),
            'no_cv' => $query->where('ai_status', AtsScreeningStatus::NoCv->value),
            'failed' => $query->where('ai_status', AtsScreeningStatus::Failed->value),
            'unreadable' => $query->where('ai_status', AtsScreeningStatus::Unreadable->value),
            default => $query->where(fn (Builder $pending) => $pending
                ->whereNull('ai_status')
                ->orWhereIn('ai_status', [AtsScreeningStatus::Pending->value, AtsScreeningStatus::Processing->value])),
        };
    }

    /**
     * @param  list<int>  $jobIds
     * @return array<int, string>
     */
    private function jobHashes(array $jobIds): array
    {
        if ($jobIds === []) {
            return [];
        }

        return JobPost::query()
            ->whereKey($jobIds)
            ->get()
            ->mapWithKeys(fn (JobPost $job): array => [
                $job->id => $this->atsInputBuilder->jobHash($this->atsInputBuilder->jobContext($job)),
            ])
            ->all();
    }

    /**
     * @param  Builder<JobApplication>  $allForEmployer
     * @return array{
     *     enabled: bool,
     *     ai_enabled: bool,
     *     has_pending: bool,
     *     rescore_url: string|null,
     *     thresholds: array{strong: int, possible: int},
     *     suggested_shortlist: list<array<string, mixed>>
     * }
     */
    private function atsProps(Request $request, bool $atsEnabled, int $jobId, Builder $allForEmployer): array
    {
        if (! $atsEnabled) {
            return [
                'enabled' => false,
                'ai_enabled' => false,
                'has_pending' => false,
                'rescore_url' => null,
                'thresholds' => [
                    'strong' => $this->atsSettings->strongThreshold(),
                    'possible' => $this->atsSettings->possibleThreshold(),
                ],
                'suggested_shortlist' => [],
            ];
        }

        $shortlist = [];
        $employer = $request->user();
        $job = $jobId > 0 && $employer !== null
            ? EmployerJobAccess::constrainJobQuery(JobPost::query(), $employer)->whereKey($jobId)->first()
            : null;

        if ($job instanceof JobPost) {
            $shortlist = JobApplication::query()
                ->where('job_post_id', $job->id)
                ->whereIn('status', [JobApplicationStatus::Applied->value, JobApplicationStatus::UnderReview->value])
                ->where('ai_status', AtsScreeningStatus::Completed->value)
                ->where('ai_score', '>=', $this->atsSettings->strongThreshold())
                ->with('jobSeeker:id,name')
                ->orderByDesc('ai_score')
                ->oldest()
                ->limit($this->atsSettings->shortlistSize())
                ->get()
                ->map(fn (JobApplication $application): array => [
                    'id' => $application->id,
                    'name' => $application->jobSeeker?->name ?? 'Applicant',
                    'ai_score' => $application->ai_score,
                    'ai_source' => $application->ai_source?->value,
                    'ai_summary' => $application->ai_summary,
                    'status' => $application->status?->label(),
                ])
                ->values()
                ->all();
        }

        return [
            'enabled' => true,
            'ai_enabled' => $this->atsSettings->aiEnabled(),
            'has_pending' => $allForEmployer
                ->whereIn('ai_status', [AtsScreeningStatus::Pending->value, AtsScreeningStatus::Processing->value])
                ->exists(),
            'rescore_url' => $job instanceof JobPost ? route('employer.jobs.applications.rescore', $job) : null,
            'thresholds' => [
                'strong' => $this->atsSettings->strongThreshold(),
                'possible' => $this->atsSettings->possibleThreshold(),
            ],
            'suggested_shortlist' => $shortlist,
        ];
    }

    /**
     * @param  array<int, string>  $jobHashes
     * @return array<string, mixed>
     */
    private function aiFields(JobApplication $application, bool $atsEnabled, array $jobHashes): array
    {
        $breakdown = is_array($application->ai_breakdown) ? $application->ai_breakdown : null;
        $completed = $application->ai_status === AtsScreeningStatus::Completed;
        $scoredJobHash = $breakdown['job_hash'] ?? null;
        $showError = in_array($application->ai_status, [
            AtsScreeningStatus::Failed,
            AtsScreeningStatus::Unreadable,
        ], true) || ($completed && $application->ai_source === AtsScoreSource::Rules && filled($application->ai_error));

        return [
            'ai_score' => $completed ? $application->ai_score : null,
            'ai_status' => $application->ai_status?->value,
            'ai_source' => $application->ai_source?->value,
            'ai_recommendation' => $completed ? $application->ai_recommendation?->value : null,
            'ai_summary' => $completed ? $application->ai_summary : null,
            'ai_breakdown' => $completed && $breakdown !== null
                ? collect($breakdown)->except(['job_hash', 'version', 'ai_recommendation'])->all()
                : null,
            'ai_scored_at' => $application->ai_scored_at?->format('M j, Y g:i A'),
            'ai_outdated' => $atsEnabled
                && $completed
                && is_string($scoredJobHash)
                && isset($jobHashes[$application->job_post_id])
                && $jobHashes[$application->job_post_id] !== $scoredJobHash,
            'ai_cv_name' => filled($application->resume_path)
                ? ($application->resume_original_name ?: basename((string) $application->resume_path))
                : null,
            'ai_error' => $showError && filled($application->ai_error)
                ? (string) $application->ai_error
                : null,
            'ai_rescore_url' => $atsEnabled
                ? route('employer.applications.rescore', $application)
                : null,
        ];
    }

    /**
     * @param  array<int, string>  $jobHashes
     * @param  array<int, int>  $rosterEntryIds
     * @return array<string, mixed>
     */
    private function row(JobApplication $application, bool $atsEnabled = false, array $jobHashes = [], array $rosterEntryIds = []): array
    {
        $next = $application->status?->next();
        $seeker = $application->jobSeeker;
        $rosterEntryId = $seeker instanceof User
            ? ($rosterEntryIds[(int) $seeker->id] ?? null)
            : null;
        $onRoster = $rosterEntryId !== null;

        if (! $seeker instanceof User) {
            return [
                'id' => $application->id,
                'name' => 'Applicant',
                'title' => 'Applicant',
                'headline' => null,
                'current_title' => null,
                'gender' => null,
                'gender_label' => null,
                'nationality' => null,
                'qualification' => null,
                'certificate_count' => 0,
                'experience_years' => '—',
                'email' => '—',
                'phone' => '—',
                'location' => '—',
                'preview_location' => '—',
                'bio' => null,
                'linkedin_url' => null,
                'github_url' => null,
                'industry' => null,
                'expected_salary' => null,
                'availability' => [],
                'skills' => [],
                'education' => [],
                'experience' => [],
                'languages' => [],
                'certifications' => [],
                'references' => [],
                'cover_letter' => $application->cover_letter,
                'question_answers' => JobApplicationQuestions::paired(
                    JobApplicationQuestions::normalize($application->jobPost?->application_questions),
                    $application->question_answers,
                ),
                'resume_name' => null,
                'has_resume_file' => false,
                'highest_degree_name' => null,
                'highest_degree_url' => null,
                'other_document_name' => null,
                'other_document_url' => null,
                'cover_letter_file_name' => null,
                'cover_letter_file_url' => null,
                'avatar_url' => null,
                'job' => $application->jobPost?->title,
                'job_id' => $application->job_post_id,
                'status' => $application->status?->label(),
                'status_value' => $application->status?->value,
                ...$this->statusChangeFields($application),
                'date' => $application->created_at?->format('M j, Y'),
                'resume_url' => route('employer.applications.resume', $application),
                'timeline' => $this->formatTimeline($application->timeline()),
                'next_status' => $next?->value,
                'can_move' => $next instanceof JobApplicationStatus,
                'can_reject' => $application->status !== JobApplicationStatus::Withdrawn
                    && $application->status !== JobApplicationStatus::Rejected,
                'on_roster' => false,
                'roster_entry_id' => null,
                ...$this->aiFields($application, $atsEnabled, $jobHashes),
            ];
        }

        $preview = ApplicantDocumentDownloader::withDownloadUrls(
            ApplicantProfilePreview::from($seeker, $application),
            $application,
            'employer',
        );

        return [
            ...$preview,
            'qualification' => ApplicantQualification::label($seeker->jobSeekerProfile) ?: null,
            'certificate_count' => (int) ($seeker->jobSeekerProfile?->certificate_count
                ?? ApplicantQualification::certificateCount($seeker->jobSeekerProfile)),
            'id' => $application->id,
            'job' => $application->jobPost?->title,
            'job_id' => $application->job_post_id,
            'status' => $application->status?->label(),
            'status_value' => $application->status?->value,
            ...$this->statusChangeFields($application),
            'date' => $application->created_at?->format('M j, Y'),
            'resume_url' => route('employer.applications.resume', $application),
            'question_answers' => JobApplicationQuestions::paired(
                JobApplicationQuestions::normalize($application->jobPost?->application_questions),
                $application->question_answers,
            ),
            'timeline' => $this->formatTimeline($application->timeline()),
            'next_status' => $next?->value,
            'can_move' => $next instanceof JobApplicationStatus,
            'can_reject' => $application->status !== JobApplicationStatus::Withdrawn
                && $application->status !== JobApplicationStatus::Rejected,
            'on_roster' => $onRoster,
            'roster_entry_id' => $rosterEntryId,
            ...$this->aiFields($application, $atsEnabled, $jobHashes),
        ];
    }

    /**
     * @return array{
     *     status_changed_by: string|null,
     *     status_history: list<array{status: string, changed_by: string, at: string|null}>
     * }
     */
    private function statusChangeFields(JobApplication $application): array
    {
        $history = ($application->relationLoaded('statusChanges')
            ? $application->statusChanges
            : $application->statusChanges()->with('changedBy:id,name')->get()
        )->take(5);

        $latest = $history->first();

        return [
            'status_changed_by' => $latest?->changedBy?->name,
            'status_history' => $history
                ->map(fn (JobApplicationStatusChange $change): array => [
                    'status' => $change->to_status?->label() ?? (string) $change->getRawOriginal('to_status'),
                    'changed_by' => $change->changedBy?->name ?? 'Unknown',
                    'at' => $change->created_at?->format('M j, Y g:i A'),
                ])
                ->values()
                ->all(),
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
}
