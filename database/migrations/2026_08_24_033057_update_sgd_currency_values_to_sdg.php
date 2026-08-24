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
        if (Schema::hasTable('job_posts')) {
            DB::table('job_posts')
                ->where('salary_range', 'like', 'SGD %')
                ->orWhere('salary_range', 'like', '% SGD %')
                ->update([
                    'salary_range' => DB::raw("REPLACE(salary_range, 'SGD', 'SDG')"),
                ]);
        }

        if (Schema::hasTable('job_seeker_profiles')) {
            DB::table('job_seeker_profiles')
                ->where('expected_salary', 'like', 'SGD %')
                ->orWhere('expected_salary', 'like', '% SGD %')
                ->update([
                    'expected_salary' => DB::raw("REPLACE(expected_salary, 'SGD', 'SDG')"),
                ]);
        }

        if (Schema::hasTable('payments')) {
            DB::table('payments')
                ->where('currency', 'SGD')
                ->update(['currency' => 'SDG']);
        }

        if (Schema::hasTable('packages')) {
            DB::table('packages')
                ->where('currency', 'SGD')
                ->update(['currency' => 'SDG']);

            if (Schema::hasColumn('packages', 'stripe_price_currency')) {
                DB::table('packages')
                    ->where('stripe_price_currency', 'sgd')
                    ->update(['stripe_price_currency' => 'sdg']);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_posts')) {
            DB::table('job_posts')
                ->where('salary_range', 'like', 'SDG %')
                ->orWhere('salary_range', 'like', '% SDG %')
                ->update([
                    'salary_range' => DB::raw("REPLACE(salary_range, 'SDG', 'SGD')"),
                ]);
        }

        if (Schema::hasTable('job_seeker_profiles')) {
            DB::table('job_seeker_profiles')
                ->where('expected_salary', 'like', 'SDG %')
                ->orWhere('expected_salary', 'like', '% SDG %')
                ->update([
                    'expected_salary' => DB::raw("REPLACE(expected_salary, 'SDG', 'SGD')"),
                ]);
        }

        if (Schema::hasTable('payments')) {
            DB::table('payments')
                ->where('currency', 'SDG')
                ->update(['currency' => 'SGD']);
        }

        if (Schema::hasTable('packages')) {
            DB::table('packages')
                ->where('currency', 'SDG')
                ->update(['currency' => 'SGD']);

            if (Schema::hasColumn('packages', 'stripe_price_currency')) {
                DB::table('packages')
                    ->where('stripe_price_currency', 'sdg')
                    ->update(['stripe_price_currency' => 'sgd']);
            }
        }
    }
};
