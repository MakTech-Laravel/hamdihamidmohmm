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
                ->where('salary_range', 'like', 'AED %')
                ->orWhere('salary_range', 'like', '% AED %')
                ->update([
                    'salary_range' => DB::raw("REPLACE(salary_range, 'AED', 'SGD')"),
                ]);
        }

        if (Schema::hasTable('job_seeker_profiles')) {
            DB::table('job_seeker_profiles')
                ->where('expected_salary', 'like', 'AED %')
                ->orWhere('expected_salary', 'like', '% AED %')
                ->update([
                    'expected_salary' => DB::raw("REPLACE(expected_salary, 'AED', 'SGD')"),
                ]);
        }

        if (Schema::hasTable('payments')) {
            DB::table('payments')
                ->where('currency', 'AED')
                ->update(['currency' => 'SGD']);
        }

        if (Schema::hasTable('packages')) {
            DB::table('packages')
                ->where('currency', 'AED')
                ->update(['currency' => 'SGD']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_posts')) {
            DB::table('job_posts')
                ->where('salary_range', 'like', 'SGD %')
                ->orWhere('salary_range', 'like', '% SGD %')
                ->update([
                    'salary_range' => DB::raw("REPLACE(salary_range, 'SGD', 'AED')"),
                ]);
        }

        if (Schema::hasTable('job_seeker_profiles')) {
            DB::table('job_seeker_profiles')
                ->where('expected_salary', 'like', 'SGD %')
                ->orWhere('expected_salary', 'like', '% SGD %')
                ->update([
                    'expected_salary' => DB::raw("REPLACE(expected_salary, 'SGD', 'AED')"),
                ]);
        }

        if (Schema::hasTable('payments')) {
            DB::table('payments')
                ->where('currency', 'SGD')
                ->update(['currency' => 'AED']);
        }

        if (Schema::hasTable('packages')) {
            DB::table('packages')
                ->where('currency', 'SGD')
                ->update(['currency' => 'AED']);
        }
    }
};
