<?php

use App\Enums\JobApplicationStatus;

it('advances along the hiring pipeline', function (JobApplicationStatus $current, ?JobApplicationStatus $next) {
    expect($current->next())->toBe($next);
})->with([
    [JobApplicationStatus::Applied, JobApplicationStatus::UnderReview],
    [JobApplicationStatus::UnderReview, JobApplicationStatus::Shortlisted],
    [JobApplicationStatus::Shortlisted, JobApplicationStatus::Interview],
    [JobApplicationStatus::Interview, JobApplicationStatus::Offer],
    [JobApplicationStatus::Offer, JobApplicationStatus::Hired],
    [JobApplicationStatus::Hired, null],
    [JobApplicationStatus::Rejected, null],
    [JobApplicationStatus::Withdrawn, null],
]);
