<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('packages')) {
            DB::table('packages')
                ->where('currency', 'SAR')
                ->update(['currency' => 'SGD']);

            if (Schema::hasColumn('packages', 'stripe_price_currency')) {
                DB::table('packages')
                    ->where('stripe_price_currency', 'sar')
                    ->update(['stripe_price_currency' => 'sgd']);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('packages')) {
            DB::table('packages')
                ->where('currency', 'SGD')
                ->update(['currency' => 'SAR']);

            if (Schema::hasColumn('packages', 'stripe_price_currency')) {
                DB::table('packages')
                    ->where('stripe_price_currency', 'sgd')
                    ->update(['stripe_price_currency' => 'sar']);
            }
        }
    }
};
