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
        Schema::table('training_registrations', function (Blueprint $table) {
            $table->foreignId('training_course_id')->constrained()->cascadeOnDelete();
            $table->string('registration_number')->unique();
            $table->string('public_token')->unique();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('country_city');
            $table->string('organization');
            $table->string('job_title');
            $table->text('experience');
            $table->text('reason');
            $table->json('answers')->nullable();
            $table->timestamp('consent_accepted_at');
            $table->string('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('training_course_id');
            $table->dropColumn([
                'registration_number',
                'public_token',
                'full_name',
                'email',
                'phone',
                'country_city',
                'organization',
                'job_title',
                'experience',
                'reason',
                'answers',
                'consent_accepted_at',
                'status',
            ]);
        });
    }
};
