<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('company_logo_path')->nullable()->after('avatar');
            $table->string('company_cover_path')->nullable()->after('company_logo_path');
            $table->string('verification_document_path')->nullable()->after('company_cover_path');
            $table->string('verification_document_original_name')->nullable()->after('verification_document_path');
            $table->string('timezone')->nullable()->after('location');
            $table->json('portal_preferences')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'company_logo_path',
                'company_cover_path',
                'verification_document_path',
                'verification_document_original_name',
                'timezone',
                'portal_preferences',
            ]);
        });
    }
};
