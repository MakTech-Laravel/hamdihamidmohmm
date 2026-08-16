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
        Schema::table('users', function (Blueprint $table) {
            $table->string('company_size')->nullable()->after('industry');
            $table->unsignedSmallInteger('founded_year')->nullable()->after('company_size');
            $table->string('linkedin_url')->nullable()->after('website');
            $table->string('x_url')->nullable()->after('linkedin_url');
            $table->string('instagram_url')->nullable()->after('x_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'company_size',
                'founded_year',
                'linkedin_url',
                'x_url',
                'instagram_url',
            ]);
        });
    }
};
