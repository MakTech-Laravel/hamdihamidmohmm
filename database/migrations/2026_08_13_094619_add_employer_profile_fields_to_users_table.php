<?php

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
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
            $table->string('industry')->nullable()->after('company_name');
            $table->string('contact_name')->nullable()->after('industry');
            $table->string('verification_status')->nullable()->after('role');
            $table->string('account_status')->nullable()->after('verification_status');
            $table->string('package')->nullable()->after('account_status');
            $table->text('rejection_reason')->nullable()->after('package');
            $table->timestamp('verified_at')->nullable()->after('rejection_reason');
        });

        DB::table('users')
            ->where('role', UserRole::Employer->value)
            ->update([
                'verification_status' => EmployerVerificationStatus::Approved->value,
                'account_status' => EmployerAccountStatus::Active->value,
                'package' => EmployerPackage::Starter->value,
                'contact_name' => DB::raw('name'),
                'verified_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'industry',
                'contact_name',
                'verification_status',
                'account_status',
                'package',
                'rejection_reason',
                'verified_at',
            ]);
        });
    }
};
