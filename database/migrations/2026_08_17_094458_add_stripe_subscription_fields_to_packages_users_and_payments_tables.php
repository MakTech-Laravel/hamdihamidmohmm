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
            $table->string('stripe_product_id')->nullable()->after('sort_order');
            $table->string('stripe_price_id')->nullable()->after('stripe_product_id');
            $table->unsignedInteger('stripe_price_amount')->nullable()->after('stripe_price_id');
            $table->string('stripe_price_currency', 3)->nullable()->after('stripe_price_amount');
            $table->string('stripe_price_interval', 20)->nullable()->after('stripe_price_currency');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('stripe_customer_id')->nullable()->after('package');
            $table->string('stripe_subscription_id')->nullable()->after('stripe_customer_id');
            $table->string('subscription_status')->nullable()->after('stripe_subscription_id');
            $table->timestamp('subscription_ends_at')->nullable()->after('subscription_status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('stripe_checkout_session_id')->nullable()->after('reference');
            $table->string('stripe_subscription_id')->nullable()->after('stripe_checkout_session_id');
            $table->string('stripe_invoice_id')->nullable()->after('stripe_subscription_id');
            $table->string('stripe_payment_intent_id')->nullable()->after('stripe_invoice_id');
            $table->string('invoice_url')->nullable()->after('stripe_payment_intent_id');

            $table->unique('stripe_checkout_session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['stripe_checkout_session_id']);
            $table->dropColumn([
                'stripe_checkout_session_id',
                'stripe_subscription_id',
                'stripe_invoice_id',
                'stripe_payment_intent_id',
                'invoice_url',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_customer_id',
                'stripe_subscription_id',
                'subscription_status',
                'subscription_ends_at',
            ]);
        });

        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_product_id',
                'stripe_price_id',
                'stripe_price_amount',
                'stripe_price_currency',
                'stripe_price_interval',
            ]);
        });
    }
};
