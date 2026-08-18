<?php

use App\Enums\PlanChangeAction;
use App\Models\Package;
use App\Support\EmployerPlanChange;

test('the current plan cannot be purchased again', function () {
    $business = new Package(['slug' => 'premium', 'price' => 999, 'job_credits' => 15]);

    expect(EmployerPlanChange::action($business, $business))->toBe(PlanChangeAction::Current);
});

test('a higher priced plan is an upgrade', function () {
    $business = new Package(['slug' => 'premium', 'price' => 999, 'job_credits' => 15]);
    $enterprise = new Package(['slug' => 'enterprise', 'price' => 1199, 'job_credits' => 30]);

    expect(EmployerPlanChange::action($business, $enterprise))->toBe(PlanChangeAction::Upgrade);
});

test('a lower priced plan is a downgrade', function () {
    $business = new Package(['slug' => 'premium', 'price' => 999, 'job_credits' => 15]);
    $single = new Package(['slug' => 'professional', 'price' => 299, 'job_credits' => 1]);

    expect(EmployerPlanChange::action($business, $single))->toBe(PlanChangeAction::Downgrade);
});

test('employers without a current plan select rather than switch', function () {
    $single = new Package(['slug' => 'professional', 'price' => 299, 'job_credits' => 1]);

    expect(EmployerPlanChange::action(null, $single))->toBe(PlanChangeAction::Select);
});
