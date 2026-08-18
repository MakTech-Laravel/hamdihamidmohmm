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
            if (! Schema::hasColumn('users', 'pending_package')) {
                $table->string('pending_package')->nullable()->after('subscription_ends_at');
            }
            if (! Schema::hasColumn('users', 'pending_package_at')) {
                $table->timestamp('pending_package_at')->nullable();
            }
            if (! Schema::hasColumn('users', 'stripe_schedule_id')) {
                $table->string('stripe_schedule_id')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = array_values(array_filter([
                'pending_package',
                'pending_package_at',
                'stripe_schedule_id',
            ], fn (string $column): bool => Schema::hasColumn('users', $column)));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
