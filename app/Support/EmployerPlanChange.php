<?php

namespace App\Support;

use App\Enums\PlanChangeAction;
use App\Models\Package;

class EmployerPlanChange
{
    public static function action(?Package $current, Package $target): PlanChangeAction
    {
        if ($current instanceof Package && $current->slug === $target->slug) {
            return PlanChangeAction::Current;
        }

        if (! $current instanceof Package) {
            return PlanChangeAction::Select;
        }

        $priceDelta = (int) $target->price <=> (int) $current->price;

        if ($priceDelta === 1) {
            return PlanChangeAction::Upgrade;
        }

        if ($priceDelta === -1) {
            return PlanChangeAction::Downgrade;
        }

        $creditDelta = (int) $target->job_credits <=> (int) $current->job_credits;

        if ($creditDelta === 1) {
            return PlanChangeAction::Upgrade;
        }

        if ($creditDelta === -1) {
            return PlanChangeAction::Downgrade;
        }

        return PlanChangeAction::Select;
    }
}
