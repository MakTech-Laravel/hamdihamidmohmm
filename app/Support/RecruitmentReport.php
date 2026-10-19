<?php

namespace App\Support;

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use Illuminate\Support\Collection;

class RecruitmentReport
{
    /**
     * @return list<string>
     */
    public static function headings(): array
    {
        return [
            'Job ID',
            'Job Title',
            'Closing Date',
            'Full Name',
            'Gender',
            'Email',
            'Phone',
            'Nationality',
            'Location',
            'Total Experience',
            'Highest Qualification',
            'Certificates',
            'Status',
            'Applied On',
        ];
    }

    /**
     * @param  Collection<int, JobApplication>  $applications
     * @return list<list<string|int>>
     */
    public static function rows(Collection $applications): array
    {
        return $applications
            ->map(function (JobApplication $application): array {
                $seeker = $application->jobSeeker;
                $profile = $seeker?->jobSeekerProfile;
                $job = $application->jobPost;

                return [
                    $job instanceof JobPost ? self::jobReference($job) : '',
                    (string) $job?->title,
                    (string) $job?->expires_at?->toDateString(),
                    (string) ($seeker?->name ?? 'Applicant'),
                    (string) ($profile?->gender?->label() ?? ''),
                    (string) ($seeker?->email ?? ''),
                    (string) ($seeker?->phone ?? ''),
                    (string) ($profile?->nationality ?? ''),
                    (string) ($seeker?->location ?? ''),
                    self::experience($profile),
                    ApplicantQualification::label($profile),
                    ApplicantQualification::certificateCount($profile),
                    (string) $application->status?->label(),
                    (string) $application->created_at?->toDateString(),
                ];
            })
            ->values()
            ->all();
    }

    public static function jobReference(JobPost $job): string
    {
        return 'JOB-'.str_pad((string) $job->id, 5, '0', STR_PAD_LEFT);
    }

    private static function experience(?JobSeekerProfile $profile): string
    {
        $label = $profile?->experienceLabel() ?? '—';

        return $label === '—' ? '' : $label;
    }
}
