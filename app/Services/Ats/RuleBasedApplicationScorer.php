<?php

namespace App\Services\Ats;

use Illuminate\Support\Str;

/**
 * Offline fallback scorer used when no AI provider is available. Produces the same evaluation shape as the AI screener.
 */
class RuleBasedApplicationScorer
{
    private const MAX_YEARS = 45;

    /**
     * @var array<int, string>
     */
    private const EDUCATION_LABELS = [
        1 => 'High school',
        2 => 'Diploma',
        3 => "Bachelor's degree",
        4 => "Master's degree",
        5 => 'Doctorate',
    ];

    /**
     * @var array<int, list<string>>
     */
    private const EDUCATION_KEYWORDS = [
        5 => ['phd', 'ph.d', 'doctorate', 'doctoral', 'دكتوراه'],
        4 => ['master', 'masters', 'msc', 'm.sc', 'mba', 'm.a.', 'ma degree', 'ماجستير'],
        3 => ['bachelor', 'bachelors', 'bsc', 'b.sc', 'b.s.', 'b.a.', 'b.eng', 'beng', 'undergraduate degree', 'university degree', 'بكالوريوس', 'ليسانس'],
        2 => ['diploma', 'associate degree', 'higher national', 'دبلوم'],
        1 => ['high school', 'secondary school', 'secondary certificate', 'ثانوية'],
    ];

    /**
     * @param  array{skills: list<string>, experience_level: string, requirements: string, description: string}  $job
     * @return array{
     *     skills_score: int,
     *     matched_skills: list<string>,
     *     missing_skills: list<string>,
     *     experience_score: int,
     *     experience_reason: string,
     *     education_score: int,
     *     education_reason: string,
     *     strengths: list<string>,
     *     gaps: list<string>,
     *     summary: string
     * }
     */
    public function evaluate(array $job, string $cvText): array
    {
        $haystack = Str::lower($cvText);

        [$skillsScore, $matched, $missing] = $this->scoreSkills($job['skills'], $haystack);
        [$experienceScore, $experienceReason, $candidateYears] = $this->scoreExperience($job['experience_level'], $haystack);
        [$educationScore, $educationReason, $candidateLevel] = $this->scoreEducation(
            Str::lower($job['requirements'].' '.$job['description']),
            $haystack,
        );

        $strengths = [];
        $gaps = [];

        if ($matched !== []) {
            $strengths[] = 'Skills found in CV: '.implode(', ', array_slice($matched, 0, 6));
        }

        if ($missing !== []) {
            $gaps[] = 'Skills not found in CV: '.implode(', ', array_slice($missing, 0, 6));
        }

        if ($experienceScore >= 70) {
            $strengths[] = $experienceReason;
        } else {
            $gaps[] = $experienceReason;
        }

        if ($educationScore >= 70) {
            $strengths[] = $educationReason;
        } elseif ($educationScore < 50) {
            $gaps[] = $educationReason;
        }

        $skillsSentence = $job['skills'] === []
            ? 'The job lists no specific skills.'
            : sprintf('Matched %d of %d listed skills.', count($matched), count($job['skills']));
        $experienceSentence = $candidateYears === null
            ? 'No clear years of experience were found in the CV.'
            : sprintf('About %d year%s of experience found.', $candidateYears, $candidateYears === 1 ? '' : 's');
        $educationSentence = $candidateLevel === null
            ? 'No degree was detected.'
            : 'Highest education detected: '.self::EDUCATION_LABELS[$candidateLevel].'.';

        return [
            'skills_score' => $skillsScore,
            'matched_skills' => $matched,
            'missing_skills' => $missing,
            'experience_score' => $experienceScore,
            'experience_reason' => $experienceReason,
            'education_score' => $educationScore,
            'education_reason' => $educationReason,
            'strengths' => array_slice($strengths, 0, 6),
            'gaps' => array_slice($gaps, 0, 6),
            'summary' => 'Basic keyword match (AI review unavailable). '.$skillsSentence.' '.$experienceSentence.' '.$educationSentence,
        ];
    }

    /**
     * @param  list<string>  $skills
     * @return array{0: int, 1: list<string>, 2: list<string>}
     */
    private function scoreSkills(array $skills, string $haystack): array
    {
        if ($skills === []) {
            return [50, [], []];
        }

        $matched = [];
        $missing = [];

        foreach ($skills as $skill) {
            if ($this->containsAny($haystack, $this->skillVariants($skill))) {
                $matched[] = $skill;
            } else {
                $missing[] = $skill;
            }
        }

        return [(int) round(count($matched) / count($skills) * 100), $matched, $missing];
    }

    /**
     * @return list<string>
     */
    private function skillVariants(string $skill): array
    {
        $normalized = Str::lower(trim($skill));
        $variants = [$normalized];

        foreach ((array) config('ai.ats.skill_synonyms', []) as $canonical => $synonyms) {
            $group = array_map(fn (mixed $value): string => Str::lower((string) $value), [$canonical, ...(array) $synonyms]);

            if (in_array($normalized, $group, true)) {
                $variants = [...$variants, ...$group];
            }
        }

        return array_values(array_unique(array_filter($variants)));
    }

    /**
     * @return array{0: int, 1: string, 2: int|null}
     */
    private function scoreExperience(string $experienceLevel, string $haystack): array
    {
        $required = $this->requiredYears($experienceLevel);
        $years = $this->candidateYears($haystack);
        $levelLabel = $experienceLevel !== '' ? $experienceLevel : 'this';

        if ($years === null) {
            return [30, 'No clear work experience duration found in the CV.', null];
        }

        if ($required === null) {
            return [$years > 0 ? 65 : 45, sprintf('About %d years of experience; the job states no specific level.', $years), $years];
        }

        if ($years >= $required['min']) {
            $overqualified = $required['max'] !== null && $years > $required['max'] + 5;

            return [
                $overqualified ? 85 : 100,
                sprintf('About %d years of experience meets the %s level requirement.', $years, $levelLabel),
                $years,
            ];
        }

        $score = $required['min'] > 0 ? (int) round($years / $required['min'] * 80) : 80;

        return [
            max(10, min(80, $score)),
            sprintf('About %d years of experience is below the %s level requirement.', $years, $levelLabel),
            $years,
        ];
    }

    /**
     * @return array{min: int, max: int|null}|null
     */
    private function requiredYears(string $experienceLevel): ?array
    {
        $level = Str::lower($experienceLevel);

        if ($level === '') {
            return null;
        }

        if (preg_match('/(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})/u', $level, $range) === 1) {
            return ['min' => (int) $range[1], 'max' => (int) $range[2]];
        }

        if (preg_match('/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/u', $level, $single) === 1) {
            return ['min' => (int) $single[1], 'max' => null];
        }

        foreach ((array) config('ai.ats.experience_levels', []) as $keyword => $bounds) {
            if (str_contains($level, Str::lower((string) $keyword))) {
                return [
                    'min' => (int) ($bounds['min'] ?? 0),
                    'max' => isset($bounds['max']) ? (int) $bounds['max'] : null,
                ];
            }
        }

        return null;
    }

    private function candidateYears(string $haystack): ?int
    {
        $explicit = null;

        if (preg_match_all('/(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+\w+){0,3}\s+experience/u', $haystack, $matches) > 0) {
            $explicit = (int) max(array_map('intval', $matches[1]));
        }

        $currentYear = (int) now()->format('Y');
        $ranges = [];

        if (preg_match_all('/\b((?:19|20)\d{2})\s*(?:-|–|—|to|until)\s*((?:19|20)\d{2}|present|current|now|today|date)\b/u', $haystack, $rangeMatches, PREG_SET_ORDER) > 0) {
            foreach ($rangeMatches as $match) {
                $start = (int) $match[1];
                $end = ctype_digit($match[2]) ? (int) $match[2] : $currentYear;

                if ($start <= $end && $end <= $currentYear + 1) {
                    $ranges[] = [$start, $end];
                }
            }
        }

        $rangeYears = $this->mergedYears($ranges);
        $years = max($explicit ?? 0, $rangeYears);

        if ($explicit === null && $ranges === []) {
            return null;
        }

        return min(self::MAX_YEARS, $years);
    }

    /**
     * @param  list<array{0: int, 1: int}>  $ranges
     */
    private function mergedYears(array $ranges): int
    {
        if ($ranges === []) {
            return 0;
        }

        usort($ranges, fn (array $a, array $b): int => $a[0] <=> $b[0]);

        $total = 0;
        [$currentStart, $currentEnd] = $ranges[0];

        foreach (array_slice($ranges, 1) as [$start, $end]) {
            if ($start <= $currentEnd) {
                $currentEnd = max($currentEnd, $end);

                continue;
            }

            $total += $currentEnd - $currentStart;
            [$currentStart, $currentEnd] = [$start, $end];
        }

        return $total + ($currentEnd - $currentStart);
    }

    /**
     * @return array{0: int, 1: string, 2: int|null}
     */
    private function scoreEducation(string $jobText, string $haystack): array
    {
        $required = $this->educationLevel($jobText);
        $candidate = $this->educationLevel($haystack);

        if ($required === null) {
            if ($candidate === null) {
                return [50, 'No degree detected; the job states no education requirement.', null];
            }

            return [
                $candidate >= 3 ? 75 : 60,
                self::EDUCATION_LABELS[$candidate].' detected; the job states no education requirement.',
                $candidate,
            ];
        }

        $requiredLabel = self::EDUCATION_LABELS[$required];

        if ($candidate === null) {
            return [25, "No degree detected; the job asks for a {$requiredLabel}.", null];
        }

        $candidateLabel = self::EDUCATION_LABELS[$candidate];

        return match (true) {
            $candidate >= $required => [100, "{$candidateLabel} meets the {$requiredLabel} requirement.", $candidate],
            $candidate === $required - 1 => [60, "{$candidateLabel} is one level below the {$requiredLabel} requirement.", $candidate],
            default => [30, "{$candidateLabel} is below the {$requiredLabel} requirement.", $candidate],
        };
    }

    private function educationLevel(string $text): ?int
    {
        foreach (self::EDUCATION_KEYWORDS as $level => $keywords) {
            if ($this->containsAny($text, $keywords)) {
                return $level;
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $needles
     */
    private function containsAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle === '') {
                continue;
            }

            $pattern = '/(?<![\p{L}\p{N}])'.preg_quote($needle, '/').'(?![\p{L}\p{N}])/u';

            if (preg_match($pattern, $haystack) === 1) {
                return true;
            }
        }

        return false;
    }
}
