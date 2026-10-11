<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('training_registrations', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('training_course_id')->constrained()->nullOnDelete();
            $table->unique(['user_id', 'training_course_id']);
        });

        $linkedPairs = [];

        DB::table('training_registrations')
            ->whereNull('user_id')
            ->orderBy('id')
            ->lazyById()
            ->each(function (object $registration) use (&$linkedPairs): void {
                $userId = DB::table('users')->where('email', $registration->email)->value('id');

                if ($userId === null) {
                    return;
                }

                $pair = $userId.'-'.$registration->training_course_id;

                if (isset($linkedPairs[$pair])) {
                    return;
                }

                $linkedPairs[$pair] = true;

                DB::table('training_registrations')
                    ->where('id', $registration->id)
                    ->update(['user_id' => $userId]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_registrations', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'training_course_id']);
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
