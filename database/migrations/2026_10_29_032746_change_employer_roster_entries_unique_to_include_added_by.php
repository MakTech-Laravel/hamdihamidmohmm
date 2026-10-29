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
        $indexes = collect(Schema::getIndexes('employer_roster_entries'))->pluck('name');

        Schema::table('employer_roster_entries', function (Blueprint $table) use ($indexes): void {
            if ($indexes->contains('employer_roster_entries_employer_owner_id_job_seeker_id_unique')) {
                $table->dropUnique(['employer_owner_id', 'job_seeker_id']);
            }

            if (! $indexes->contains('employer_roster_account_seeker_added_unique')) {
                $table->unique(
                    ['employer_owner_id', 'job_seeker_id', 'added_by'],
                    'employer_roster_account_seeker_added_unique',
                );
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $indexes = collect(Schema::getIndexes('employer_roster_entries'))->pluck('name');

        Schema::table('employer_roster_entries', function (Blueprint $table) use ($indexes): void {
            if ($indexes->contains('employer_roster_account_seeker_added_unique')) {
                $table->dropUnique('employer_roster_account_seeker_added_unique');
            }

            if (! $indexes->contains('employer_roster_entries_employer_owner_id_job_seeker_id_unique')) {
                $table->unique(['employer_owner_id', 'job_seeker_id']);
            }
        });
    }
};
