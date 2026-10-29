<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->boolean('hide_on_site_apply')->default(false)->after('apply_by_link');
            $table->boolean('employer_can_manage_apply')->default(true)->after('hide_on_site_apply');
        });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn(['hide_on_site_apply', 'employer_can_manage_apply']);
        });
    }
};
