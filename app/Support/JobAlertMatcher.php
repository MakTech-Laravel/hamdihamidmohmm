<?php

namespace App\Support;

use App\Enums\JobPostStatus;
use App\Models\JobAlert;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\JobAlertMatchedNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class JobAlertMatcher
{
    /**
     * Notify job seekers whose active alerts match a newly published job.
     */
    public static function notifyFor(JobPost $job): int
    {
        if ($job->status !== JobPostStatus::Active || $job->listingHasEnded()) {
            return 0;
        }

        $job->loadMissing('employer');

        $sent = 0;

        JobAlert::query()
            ->where('is_active', true)
            ->with('user')
            ->whereDoesntHave('matchedJobs', fn (Builder $query) => $query->where('job_posts.id', $job->id))
            ->orderBy('id')
            ->each(function (JobAlert $alert) use ($job, &$sent): void {
                if (! self::matches($alert, $job)) {
                    return;
                }

                $user = $alert->user;

                if (! $user instanceof User || ! $user->isJobSeeker()) {
                    return;
                }

                if (! PortalNotifier::allows($user, 'job_recommendations')) {
                    $alert->matchedJobs()->syncWithoutDetaching([$job->id]);

                    return;
                }

                $user->notify(new JobAlertMatchedNotification(
                    $job->title,
                    (string) ($job->employer?->company_name ?: $job->employer?->name ?: config('app.name')),
                    (string) $job->slug,
                    $alert->displayName(),
                ));

                $alert->matchedJobs()->syncWithoutDetaching([$job->id]);
                $sent++;
            });

        return $sent;
    }

    public static function matches(JobAlert $alert, JobPost $job): bool
    {
        if (! self::hasCriteria($alert)) {
            return false;
        }

        if (filled($alert->keyword) && ! self::keywordMatches((string) $alert->keyword, $job)) {
            return false;
        }

        if (filled($alert->country) && ! self::fieldMatches((string) $alert->country, (string) $job->country)) {
            return false;
        }

        if (filled($alert->location) && ! self::fieldMatches((string) $alert->location, (string) $job->location)) {
            return false;
        }

        if (filled($alert->category) && ! self::fieldMatches((string) $alert->category, (string) $job->category)) {
            return false;
        }

        if (filled($alert->employment_type) && ! self::fieldMatches((string) $alert->employment_type, (string) $job->employment_type)) {
            return false;
        }

        return true;
    }

    public static function hasCriteria(JobAlert $alert): bool
    {
        return filled($alert->keyword)
            || filled($alert->country)
            || filled($alert->location)
            || filled($alert->category)
            || filled($alert->employment_type);
    }

    private static function keywordMatches(string $keyword, JobPost $job): bool
    {
        $needle = Str::lower(trim($keyword));

        if ($needle === '') {
            return true;
        }

        $haystack = Str::lower(implode(' ', array_filter([
            $job->title,
            $job->subtitle,
            $job->category,
            is_array($job->skills) ? implode(' ', $job->skills) : null,
        ])));

        return str_contains($haystack, $needle);
    }

    private static function fieldMatches(string $expected, string $actual): bool
    {
        $expectedToken = JobListingQuery::normalizeToken($expected);
        $actualToken = JobListingQuery::normalizeToken($actual);

        if ($expectedToken === '' || $actualToken === '') {
            return false;
        }

        return $expectedToken === $actualToken
            || str_contains($actualToken, $expectedToken)
            || str_contains($expectedToken, $actualToken)
            || Str::lower(trim($expected)) === Str::lower(trim($actual));
    }
}
