<?php

namespace App\Enums;

enum JobApplicationStatus: string
{
    case Applied = 'applied';
    case UnderReview = 'under_review';
    case Longlisted = 'longlisted';
    case UnderConsideration = 'under_consideration';
    case Shortlisted = 'shortlisted';
    case Interview = 'interview';
    case Offer = 'offer';
    case Hired = 'hired';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Applied => 'Applied',
            self::UnderReview => 'Under Review',
            self::Longlisted => 'Longlisted',
            self::UnderConsideration => 'Under Consideration',
            self::Shortlisted => 'Shortlisted',
            self::Interview => 'Interview',
            self::Offer => 'Offer',
            self::Hired => 'Hired',
            self::Rejected => 'Rejected',
            self::Withdrawn => 'Withdrawn',
        };
    }

    /**
     * @return list<self>
     */
    public function timeline(): array
    {
        return [
            self::Applied,
            self::UnderReview,
            self::Shortlisted,
            self::Interview,
            self::Offer,
            self::Hired,
        ];
    }

    public function progress(): int
    {
        return match ($this) {
            self::Applied => 1,
            self::UnderReview => 2,
            self::Shortlisted => 3,
            self::Interview => 4,
            self::Offer => 5,
            self::Hired => 6,
            self::Longlisted, self::UnderConsideration => 2,
            self::Rejected, self::Withdrawn => 0,
        };
    }

    /**
     * Whether the status sits outside the linear hiring timeline.
     */
    public function isOffPipeline(): bool
    {
        return in_array($this, [
            self::Longlisted,
            self::UnderConsideration,
            self::Rejected,
            self::Withdrawn,
        ], true);
    }

    public function canWithdraw(): bool
    {
        return ! in_array($this, [self::Hired, self::Rejected, self::Withdrawn], true);
    }

    public function next(): ?self
    {
        $timeline = self::Applied->timeline();
        $index = array_search($this, $timeline, true);

        if ($index === false) {
            return null;
        }

        return $timeline[$index + 1] ?? null;
    }
}
