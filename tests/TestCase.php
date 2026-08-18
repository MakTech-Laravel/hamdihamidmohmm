<?php

namespace Tests;

use App\Services\Stripe\FakeStripeGateway;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        FakeStripeGateway::reset();

        $this->seed(RolePermissionSeeder::class);
    }
}
