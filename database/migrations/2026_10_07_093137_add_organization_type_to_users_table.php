<?php

use App\Enums\OrganizationType;
use App\Enums\UserRole;
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
        Schema::table('users', function (Blueprint $table) {
            $table->string('organization_type')->nullable()->after('company_name');
        });

        DB::table('users')
            ->where('role', UserRole::Employer->value)
            ->whereNull('organization_type')
            ->update(['organization_type' => OrganizationType::PrivateCompany->value]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('organization_type');
        });
    }
};
