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
        Schema::table('packages', function (Blueprint $table) {
            $table->string('description')->nullable()->after('name');
            $table->json('features')->nullable()->after('featured_credits');
            $table->json('excluded_features')->nullable()->after('features');
            $table->boolean('is_featured')->default(false)->after('is_active');
            $table->boolean('is_public')->default(true)->after('is_featured');
            $table->unsignedInteger('sort_order')->default(0)->after('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'features',
                'excluded_features',
                'is_featured',
                'is_public',
                'sort_order',
            ]);
        });
    }
};
