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
        Schema::table('job_applications', function (Blueprint $table) {
            $table->string('ai_status', 20)->nullable()->after('resume_original_name');
            $table->string('ai_source', 10)->nullable()->after('ai_status');
            $table->unsignedTinyInteger('ai_score')->nullable()->after('ai_source');
            $table->string('ai_recommendation', 20)->nullable()->after('ai_score');
            $table->text('ai_summary')->nullable()->after('ai_recommendation');
            $table->json('ai_breakdown')->nullable()->after('ai_summary');
            $table->string('ai_error')->nullable()->after('ai_breakdown');
            $table->string('ai_model', 100)->nullable()->after('ai_error');
            $table->string('ai_input_hash', 64)->nullable()->after('ai_model');
            $table->unsignedSmallInteger('ai_attempts')->default(0)->after('ai_input_hash');
            $table->unsignedInteger('ai_input_tokens')->default(0)->after('ai_attempts');
            $table->unsignedInteger('ai_output_tokens')->default(0)->after('ai_input_tokens');
            $table->timestamp('ai_scored_at')->nullable()->after('ai_output_tokens');

            $table->index('ai_status');
            $table->index(['job_post_id', 'ai_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropIndex(['ai_status']);
            $table->dropIndex(['job_post_id', 'ai_score']);
            $table->dropColumn([
                'ai_status',
                'ai_source',
                'ai_score',
                'ai_recommendation',
                'ai_summary',
                'ai_breakdown',
                'ai_error',
                'ai_model',
                'ai_input_hash',
                'ai_attempts',
                'ai_input_tokens',
                'ai_output_tokens',
                'ai_scored_at',
            ]);
        });
    }
};
