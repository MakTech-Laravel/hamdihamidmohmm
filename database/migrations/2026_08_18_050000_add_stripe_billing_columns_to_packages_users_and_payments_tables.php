<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
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

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'stripe_customer_id')) {
                $table->string('stripe_customer_id')->nullable()->after('package');
            }
            if (! Schema::hasColumn('users', 'stripe_subscription_id')) {
                $table->string('stripe_subscription_id')->nullable();
            }
            if (! Schema::hasColumn('users', 'subscription_status')) {
                $table->string('subscription_status')->nullable();
            }
            if (! Schema::hasColumn('users', 'subscription_ends_at')) {
                $table->timestamp('subscription_ends_at')->nullable();
            }
        });

        Schema::table('payments', function (Blueprint $table) {
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
            if (! Schema::hasColumn('payments', 'invoice_url')) {
                $table->string('invoice_url')->nullable();
            }
        });

        if (Schema::hasColumn('payments', 'stripe_checkout_session_id')) {
            $indexNames = collect(Schema::getIndexes('payments'))->pluck('name')->all();

            if (! in_array('payments_stripe_checkout_session_id_unique', $indexNames, true)) {
                Schema::table('payments', function (Blueprint $table) {
                    $table->unique('stripe_checkout_session_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('payments')) {
            $indexNames = collect(Schema::getIndexes('payments'))->pluck('name')->all();

            Schema::table('payments', function (Blueprint $table) use ($indexNames) {
                if (in_array('payments_stripe_checkout_session_id_unique', $indexNames, true)) {
                    $table->dropUnique(['stripe_checkout_session_id']);
                }

                $columns = array_values(array_filter([
                    'stripe_checkout_session_id',
                    'stripe_subscription_id',
                    'stripe_invoice_id',
                    'stripe_payment_intent_id',
                    'invoice_url',
                ], fn (string $column): bool => Schema::hasColumn('payments', $column)));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $columns = array_values(array_filter([
                'stripe_customer_id',
                'stripe_subscription_id',
                'subscription_status',
                'subscription_ends_at',
            ], fn (string $column): bool => Schema::hasColumn('users', $column)));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('packages', function (Blueprint $table) {
            $columns = array_values(array_filter([
                'stripe_product_id',
                'stripe_price_id',
                'stripe_price_amount',
                'stripe_price_currency',
                'stripe_price_interval',
            ], fn (string $column): bool => Schema::hasColumn('packages', $column)));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
