<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seeker_profiles', function (Blueprint $table) {
            $table->string('current_title')->nullable()->after('headline');
            $table->string('linkedin_url')->nullable()->after('bio');
            $table->string('github_url')->nullable()->after('linkedin_url');
            $table->string('industry')->nullable()->after('github_url');
            $table->string('expected_salary')->nullable()->after('industry');
            $table->json('availability')->nullable()->after('expected_salary');
        });
    }

    public function down(): void
    {
        Schema::table('job_seeker_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'current_title',
                'linkedin_url',
                'github_url',
                'industry',
                'expected_salary',
                'availability',
            ]);
        });
    }
};
