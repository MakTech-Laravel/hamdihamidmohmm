<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cover_letter_path')->nullable()->after('resume_original_name');
            $table->string('cover_letter_original_name')->nullable()->after('cover_letter_path');
            $table->string('highest_degree_path')->nullable()->after('cover_letter_original_name');
            $table->string('highest_degree_original_name')->nullable()->after('highest_degree_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'cover_letter_path',
                'cover_letter_original_name',
                'highest_degree_path',
                'highest_degree_original_name',
            ]);
        });
    }
};
