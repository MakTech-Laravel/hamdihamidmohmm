<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreEmployerRosterEntryRequest;
use App\Models\EmployerRosterEntry;
use App\Models\JobApplication;
use App\Models\User;
use App\Support\ApplicantDocumentDownloader;
use App\Support\ApplicantProfilePreview;
use App\Support\JobApplicationQuestions;
use App\Support\ListPageSize;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EmployerRosterController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless(
            $user?->isEmployer() === true
            && $user->can(PermissionName::EmployerApplications->value),
            403,
        );

        $accountId = $user->employerAccountId();
        $category = $request->string('category')->toString();
        $panelMemberId = $request->integer('panel_member_id');
        $isOwner = $user->isEmployerOwner();

        $activePanelMemberId = null;

        if ($isOwner && $panelMemberId > 0 && $this->isAccountRosterFilterUser($accountId, $panelMemberId)) {
            $activePanelMemberId = $panelMemberId;
        }

        $filteredQuery = function () use ($accountId, $category, $user, $isOwner, $panelMemberId, $activePanelMemberId): Builder {
            $query = EmployerRosterEntry::query()->forAccount($accountId);

            if ($category !== '') {
                $query->where('category', $category);
            }

            if (! $isOwner) {
                $query->where('added_by', $user->id);
            } elseif ($activePanelMemberId !== null) {
                $query->where('added_by', $activePanelMemberId);
            } elseif ($panelMemberId > 0) {
                $query->whereRaw('0 = 1');
            }

            return $query;
        };

        $dedupeBySeeker = $isOwner && $activePanelMemberId === null;

        $pageQuery = $dedupeBySeeker
            ? EmployerRosterEntry::query()->whereIn(
                'id',
                $filteredQuery()->selectRaw('MAX(id)')->groupBy('job_seeker_id'),
            )->orderByDesc('id')
            : $filteredQuery()->latest()->orderByDesc('id');

        /** @var LengthAwarePaginator<int, EmployerRosterEntry> $paginator */
        $paginator = $pageQuery
            ->with([
                'jobSeeker.jobSeekerProfile',
                'jobApplication.jobPost:id,title,employer_id,application_questions',
                'addedBy:id,name',
            ])
            ->paginate(ListPageSize::DEFAULT)
            ->withQueryString();

        $pageSeekerIds = $paginator->getCollection()
            ->map(fn (EmployerRosterEntry $entry): int => (int) $entry->job_seeker_id)
            ->filter(fn (int $id): bool => $id > 0)
            ->unique()
            ->values()
            ->all();

        $applicationsBySeeker = $this->applicationsForSeekers($accountId, $pageSeekerIds);

        /** @var Collection<int|string, Collection<int, EmployerRosterEntry>> $grouped */
        $grouped = $dedupeBySeeker
            ? $filteredQuery()
                ->whereIn('job_seeker_id', $paginator->getCollection()->pluck('job_seeker_id')->unique()->values()->all())
                ->with('addedBy:id,name')
                ->latest()
                ->get()
                ->groupBy('job_seeker_id')
            : collect();

        $entries = $paginator->through(function (EmployerRosterEntry $entry) use ($accountId, $applicationsBySeeker, $dedupeBySeeker, $grouped): array {
            $payload = $this->entryPayload(
                $entry,
                $accountId,
                $applicationsBySeeker[(int) $entry->job_seeker_id] ?? [],
            );

            if (! $dedupeBySeeker) {
                return $payload;
            }

            $group = $grouped->get($entry->job_seeker_id, collect([$entry]));

            $payload['added_by'] = $group
                ->map(fn (EmployerRosterEntry $groupEntry): ?string => $groupEntry->addedBy?->name)
                ->filter()
                ->unique()
                ->values()
                ->implode(', ');

            $payload['category'] = $group
                ->map(fn (EmployerRosterEntry $groupEntry): string => trim((string) $groupEntry->category))
                ->filter()
                ->unique()
                ->values()
                ->implode(', ');

            return $payload;
        });

        return Inertia::render('backend/User/EmployerRoster', [
            'entries' => $entries,
            'categories' => EmployerRosterEntry::categoriesForAccount(
                $accountId,
                $isOwner ? null : $user->id,
            ),
            'panel_members' => $isOwner ? $this->panelMembersForAccount($accountId) : [],
            'is_owner' => $isOwner,
            'filters' => [
                'category' => $category,
                'panel_member_id' => $activePanelMemberId ?? '',
            ],
        ]);
    }

    public function store(StoreEmployerRosterEntryRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $accountId = $user->employerAccountId();
        $application = $request->application();

        abort_unless(
            (int) $application->jobPost?->employer_id === $accountId,
            403,
        );

        $seekerId = (int) $application->job_seeker_id;
        abort_unless($seekerId > 0, 422);

        EmployerRosterEntry::query()->updateOrCreate(
            [
                'employer_owner_id' => $accountId,
                'job_seeker_id' => $seekerId,
                'added_by' => $user->id,
            ],
            [
                'job_application_id' => $application->id,
                'category' => trim($request->string('category')->toString()),
                'comments' => $request->filled('comments')
                    ? $request->string('comments')->toString()
                    : null,
            ],
        );

        return back()->with('success', 'Candidate added to roster.');
    }

    public function destroy(Request $request, EmployerRosterEntry $entry): RedirectResponse
    {
        $user = $request->user();

        abort_unless(
            $user?->isEmployer() === true
            && $user->can(PermissionName::EmployerApplications->value)
            && (int) $entry->employer_owner_id === $user->employerAccountId(),
            403,
        );

        abort_unless(
            $user->isEmployerOwner() || (int) $entry->added_by === $user->id,
            403,
        );

        if ($user->isEmployerOwner() && $request->boolean('purge_all')) {
            EmployerRosterEntry::query()
                ->forAccount($user->employerAccountId())
                ->where('job_seeker_id', $entry->job_seeker_id)
                ->delete();
        } else {
            $entry->delete();
        }

        return back()->with('success', 'Candidate removed from roster.');
    }

    private function isAccountRosterFilterUser(int $accountId, int $userId): bool
    {
        if ($userId === $accountId) {
            return User::query()
                ->whereKey($userId)
                ->whereNull('employer_owner_id')
                ->exists();
        }

        return User::query()
            ->whereKey($userId)
            ->where('employer_owner_id', $accountId)
            ->exists();
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function panelMembersForAccount(int $accountId): array
    {
        $panelMemberIds = User::query()
            ->whereHas(
                'assignedJobPosts',
                fn (Builder $query) => $query->where('employer_id', $accountId),
            )
            ->pluck('id');

        $rosterAdderIds = EmployerRosterEntry::query()
            ->forAccount($accountId)
            ->whereNotNull('added_by')
            ->distinct()
            ->pluck('added_by');

        $ids = $panelMemberIds
            ->merge($rosterAdderIds)
            ->push($accountId)
            ->unique()
            ->filter(fn (mixed $id): bool => (int) $id > 0)
            ->values()
            ->all();

        return User::query()
            ->whereIn('id', $ids)
            ->where(function (Builder $query) use ($accountId): void {
                $query->whereKey($accountId)
                    ->orWhere('employer_owner_id', $accountId);
            })
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $member): array => [
                'id' => $member->id,
                'name' => $member->name,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  list<array{id: int, job: string|null, job_id: int|null, status: string|null, status_value: string|null, date: string|null, applications_url: string}>  $applications
     * @return array<string, mixed>
     */
    private function entryPayload(EmployerRosterEntry $entry, int $accountId, array $applications = []): array
    {
        $seeker = $entry->jobSeeker;
        $application = $entry->jobApplication;
        $preview = $this->candidatePreview($seeker, $application);

        return [
            'id' => $entry->id,
            'name' => $preview['name'] ?? $seeker?->name,
            'email' => $preview['email'] ?? $seeker?->email,
            'phone' => $preview['phone'] ?? null,
            'location' => $preview['location'] ?? null,
            'experience_years' => $preview['experience_years'] ?? null,
            'current_title' => $preview['current_title'] ?? null,
            'job' => $application?->jobPost?->title,
            'job_application_id' => $entry->job_application_id,
            'application_status' => $application?->status?->label(),
            'application_status_value' => $application?->status?->value,
            'category' => $entry->category,
            'comments' => $entry->comments,
            'added_by' => $entry->addedBy?->name,
            'created_at' => $entry->created_at?->toDateString(),
            'applications_count' => count($applications),
            'applications' => $applications,
            'candidate' => $preview,
        ];
    }

    /**
     * @param  list<int>  $seekerIds
     * @return array<int, list<array{id: int, job: string|null, job_id: int|null, status: string|null, status_value: string|null, date: string|null, applications_url: string}>>
     */
    private function applicationsForSeekers(int $accountId, array $seekerIds): array
    {
        if ($seekerIds === []) {
            return [];
        }

        return JobApplication::query()
            ->whereIn('job_seeker_id', $seekerIds)
            ->whereHas('jobPost', fn ($query) => $query->where('employer_id', $accountId))
            ->with('jobPost:id,title,employer_id')
            ->latest()
            ->get()
            ->groupBy('job_seeker_id')
            ->map(fn ($applications) => $applications
                ->map(fn (JobApplication $application): array => [
                    'id' => $application->id,
                    'job' => $application->jobPost?->title,
                    'job_id' => $application->job_post_id,
                    'status' => $application->status?->label(),
                    'status_value' => $application->status?->value,
                    'date' => $application->created_at?->toDateString(),
                    'applications_url' => route('employer.applications', [
                        'job_id' => $application->job_post_id,
                    ]),
                ])
                ->values()
                ->all())
            ->mapWithKeys(fn (array $apps, mixed $seekerId): array => [(int) $seekerId => $apps])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function candidatePreview(?User $seeker, ?JobApplication $application): array
    {
        if (! $seeker instanceof User) {
            return [
                'name' => 'Applicant',
                'title' => 'Applicant',
                'status' => $application?->status?->label(),
                'status_value' => $application?->status?->value,
                'email' => '—',
                'phone' => '—',
                'location' => '—',
                'current_title' => null,
                'gender' => null,
                'experience_years' => '—',
                'industry' => null,
                'expected_salary' => null,
                'availability' => [],
                'bio' => null,
                'linkedin_url' => null,
                'github_url' => null,
                'skills' => [],
                'education' => [],
                'experience' => [],
                'languages' => [],
                'certifications' => [],
                'references' => [],
                'cover_letter' => $application?->cover_letter,
                'question_answers' => [],
                'resume_name' => null,
                'resume_url' => null,
                'highest_degree_name' => null,
                'highest_degree_url' => null,
                'other_document_name' => null,
                'other_document_url' => null,
                'cover_letter_file_name' => null,
                'cover_letter_file_url' => null,
                'avatar_url' => null,
                'timeline' => $application instanceof JobApplication
                    ? $this->formatTimeline($application->timeline())
                    : [],
                'job' => $application?->jobPost?->title,
                'job_id' => $application?->job_post_id,
            ];
        }

        $base = $application instanceof JobApplication
            ? ApplicantDocumentDownloader::withDownloadUrls(
                ApplicantProfilePreview::from($seeker, $application),
                $application,
                'employer',
            )
            : ApplicantProfilePreview::from($seeker);

        return [
            ...$base,
            'gender' => $base['gender_label'] ?? $base['gender'] ?? null,
            'status' => $application?->status?->label(),
            'status_value' => $application?->status?->value,
            'job' => $application?->jobPost?->title,
            'job_id' => $application?->job_post_id,
            'question_answers' => $application instanceof JobApplication
                ? JobApplicationQuestions::paired(
                    JobApplicationQuestions::normalize($application->jobPost?->application_questions),
                    $application->question_answers,
                )
                : [],
            'timeline' => $application instanceof JobApplication
                ? $this->formatTimeline($application->timeline())
                : [],
            'resume_url' => $application instanceof JobApplication
                ? ($base['resume_url'] ?? route('employer.applications.resume', $application))
                : null,
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
