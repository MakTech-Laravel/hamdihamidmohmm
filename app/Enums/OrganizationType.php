<?php

namespace App\Enums;

enum OrganizationType: string
{
    case PrivateCompany = 'private_company';
    case NonProfit = 'non_profit';
    case Ngo = 'ngo';
    case Institute = 'institute';
    case PublicSector = 'public_sector';

    public function label(): string
    {
        return match ($this) {
            self::PrivateCompany => 'Private Company',
            self::NonProfit => 'Non-Profit Organization',
            self::Ngo => 'NGO',
            self::Institute => 'Institute / Educational',
            self::PublicSector => 'Public Sector',
        };
    }

    public function translationKey(): string
    {
        return 'employer.profile.organization_type.'.$this->value;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<array{value: string, label: string, translation_key: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
                'translation_key' => $type->translationKey(),
            ],
            self::cases(),
        );
    }
}
