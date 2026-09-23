<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table): void {
                $columns = array_values(array_filter([
                    Schema::hasColumn('payments', 'stripe_checkout_session_id') ? 'stripe_checkout_session_id' : null,
                    Schema::hasColumn('payments', 'stripe_subscription_id') ? 'stripe_subscription_id' : null,
                    Schema::hasColumn('payments', 'stripe_invoice_id') ? 'stripe_invoice_id' : null,
                    Schema::hasColumn('payments', 'stripe_payment_intent_id') ? 'stripe_payment_intent_id' : null,
                ]));

                if ($columns !== []) {
                    $indexNames = collect(Schema::getIndexes('payments'))->pluck('name')->all();

                    if (in_array('payments_stripe_checkout_session_id_unique', $indexNames, true)) {
                        $table->dropUnique(['stripe_checkout_session_id']);
                    }

                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table): void {
                $columns = array_values(array_filter([
                    Schema::hasColumn('users', 'stripe_customer_id') ? 'stripe_customer_id' : null,
                    Schema::hasColumn('users', 'stripe_subscription_id') ? 'stripe_subscription_id' : null,
                    Schema::hasColumn('users', 'stripe_schedule_id') ? 'stripe_schedule_id' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('packages')) {
            Schema::table('packages', function (Blueprint $table): void {
                $columns = array_values(array_filter([
                    Schema::hasColumn('packages', 'stripe_product_id') ? 'stripe_product_id' : null,
                    Schema::hasColumn('packages', 'stripe_price_id') ? 'stripe_price_id' : null,
                    Schema::hasColumn('packages', 'stripe_price_amount') ? 'stripe_price_amount' : null,
                    Schema::hasColumn('packages', 'stripe_price_currency') ? 'stripe_price_currency' : null,
                    Schema::hasColumn('packages', 'stripe_price_interval') ? 'stripe_price_interval' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('packages')) {
            Schema::table('packages', function (Blueprint $table): void {
                if (! Schema::hasColumn('packages', 'stripe_product_id')) {
                    $table->string('stripe_product_id')->nullable()->after('sort_order');
                }
                if (! Schema::hasColumn('packages', 'stripe_price_id')) {
                    $table->string('stripe_price_id')->nullable();
                }
                if (! Schema::hasColumn('packages', 'stripe_price_amount')) {
                    $table->unsignedInteger('stripe_price_amount')->nullable();
                }
                if (! Schema::hasColumn('packages', 'stripe_price_currency')) {
                    $table->string('stripe_price_currency', 3)->nullable();
                }
                if (! Schema::hasColumn('packages', 'stripe_price_interval')) {
                    $table->string('stripe_price_interval', 20)->nullable();
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table): void {
                if (! Schema::hasColumn('users', 'stripe_customer_id')) {
                    $table->string('stripe_customer_id')->nullable()->after('package');
                }
                if (! Schema::hasColumn('users', 'stripe_subscription_id')) {
                    $table->string('stripe_subscription_id')->nullable();
                }
                if (! Schema::hasColumn('users', 'stripe_schedule_id')) {
                    $table->string('stripe_schedule_id')->nullable();
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table): void {
                if (! Schema::hasColumn('payments', 'stripe_checkout_session_id')) {
                    $table->string('stripe_checkout_session_id')->nullable()->after('reference');
                }
                if (! Schema::hasColumn('payments', 'stripe_subscription_id')) {
                    $table->string('stripe_subscription_id')->nullable();
                }
                if (! Schema::hasColumn('payments', 'stripe_invoice_id')) {
                    $table->string('stripe_invoice_id')->nullable();
                }
                if (! Schema::hasColumn('payments', 'stripe_payment_intent_id')) {
                    $table->string('stripe_payment_intent_id')->nullable();
                }
            });

            if (Schema::hasColumn('payments', 'stripe_checkout_session_id')) {
                $indexNames = collect(Schema::getIndexes('payments'))->pluck('name')->all();

                if (! in_array('payments_stripe_checkout_session_id_unique', $indexNames, true)) {
                    Schema::table('payments', function (Blueprint $table): void {
                        $table->unique('stripe_checkout_session_id');
                    });
                }
            }
        }
    }
};
