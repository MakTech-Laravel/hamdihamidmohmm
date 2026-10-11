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
        Schema::table('training_courses', function (Blueprint $table) {
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('duration');
            $table->string('location');
            $table->string('trainer');
            $table->unsignedInteger('seats');
            $table->date('registration_deadline');
            $table->boolean('is_published')->default(false);
            $table->json('questions')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_courses', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'title',
                'slug',
                'description',
                'starts_on',
                'ends_on',
                'duration',
                'location',
                'trainer',
                'seats',
                'registration_deadline',
                'is_published',
                'questions',
            ]);
        });
    }
};
