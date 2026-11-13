<?php

namespace App\Enums;

enum JobTaxonomyType: string
{
    case Country = 'country';
    case DutyStation = 'duty_station';
    case PositionArea = 'position_area';
    case EmploymentType = 'employment_type';
    case ExperienceLevel = 'experience_level';
    case OrganizationType = 'organization_type';

    public function label(): string
    {
        return match ($this) {
            self::Country => 'Country',
            self::DutyStation => 'Duty Station',
            self::PositionArea => 'Position Area',
            self::EmploymentType => 'Job Type',
            self::ExperienceLevel => 'Experience Level',
            self::OrganizationType => 'Organization Type',
        };
    }
}
