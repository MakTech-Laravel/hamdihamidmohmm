<?php

namespace App\Services\Ats;

/**
 * Soft quality checks for job posts so ATS screening has enough signal.
 */
class AtsJobQuality
{
    public const MIN_BODY_CHARS = 80;

    /**
     * @param  list<mixed>|null  $skills
     * @return array{missing_skills: bool, thin_description: bool, show: bool}
     */
    public static function hints(?array $skills, ?string $requirements, ?string $description): array
    {
        $hasSkills = collect($skills ?? [])
            ->map(fn (mixed $skill): string => trim((string) $skill))
            ->filter()
            ->isNotEmpty();

        $body = trim(html_entity_decode(strip_tags(($requirements ?? '').' '.($description ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        $thinDescription = mb_strlen($body) < self::MIN_BODY_CHARS;

        return [
            'missing_skills' => ! $hasSkills,
            'thin_description' => $thinDescription,
            'show' => ! $hasSkills || $thinDescription,
        ];
    }
}
