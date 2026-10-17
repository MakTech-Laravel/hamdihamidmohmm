<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_alerts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('keyword')->nullable();
            $table->string('country')->nullable();
            $table->string('location')->nullable();
            $table->string('category')->nullable();
            $table->string('employment_type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });

        Schema::create('job_alert_matches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_alert_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['job_alert_id', 'job_post_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_alert_matches');
        Schema::dropIfExists('job_alerts');
    }
};
