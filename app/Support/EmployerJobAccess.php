<?php

namespace App\Support;

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EmployerJobAccess
{
    public static function canManagePanel(User $user): bool
    {
        return $user->isEmployerOwner();
    }

    public static function canAccessJob(User $user, JobPost $job): bool
    {
        if ((int) $job->employer_id !== $user->employerAccountId()) {
            return false;
        }

        if ($user->isEmployerOwner()) {
            return true;
        }

        return $job->panelMembers()->whereKey($user->id)->exists();
    }

    /**
     * @return Collection<int, int>
     */
    public static function jobIdsFor(User $user): Collection
    {
        $accountId = $user->employerAccountId();

        if ($user->isEmployerOwner()) {
            return JobPost::query()
                ->where('employer_id', $accountId)
                ->pluck('id');
        }

        return JobPost::query()
            ->where('employer_id', $accountId)
            ->whereHas('panelMembers', fn (Builder $query) => $query->whereKey($user->id))
            ->pluck('id');
    }

    /**
     * @param  Builder<JobPost>  $query
     * @return Builder<JobPost>
     */
    public static function constrainJobQuery(Builder $query, User $user): Builder
    {
        $query->where('employer_id', $user->employerAccountId());

        if (! $user->isEmployerOwner()) {
            $query->whereHas('panelMembers', fn (Builder $panel) => $panel->whereKey($user->id));
        }

        return $query;
    }

    /**
     * @param  Builder<JobApplication>  $query
     * @return Builder<JobApplication>
     */
    public static function constrainApplicationQuery(Builder $query, User $user): Builder
    {
        return $query->whereHas(
            'jobPost',
            fn (Builder $jobQuery) => self::constrainJobQuery($jobQuery, $user),
        );
    }

    public static function assignMember(JobPost $job, User $member, User $assignedBy): void
    {
        $job->panelMembers()->syncWithoutDetaching([
            $member->id => ['assigned_by' => $assignedBy->id],
        ]);
    }
}
