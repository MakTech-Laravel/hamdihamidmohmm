<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('other_document_path')->nullable()->after('highest_degree_original_name');
            $table->string('other_document_original_name')->nullable()->after('other_document_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['other_document_path', 'other_document_original_name']);
        });
    }
};
