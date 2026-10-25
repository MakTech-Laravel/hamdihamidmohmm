<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table): void {
            $table->json('application_questions')->nullable()->after('skills');
        });

        Schema::table('job_applications', function (Blueprint $table): void {
            $table->json('question_answers')->nullable()->after('cover_letter');
        });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table): void {
            $table->dropColumn('application_questions');
        });

        Schema::table('job_applications', function (Blueprint $table): void {
            $table->dropColumn('question_answers');
        });
    }
};
