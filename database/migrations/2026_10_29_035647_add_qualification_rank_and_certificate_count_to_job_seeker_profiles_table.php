<?php

use App\Models\JobSeekerProfile;
use App\Support\ApplicantQualification;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_seeker_profiles', function (Blueprint $table): void {
            $table->unsignedTinyInteger('qualification_rank')->default(0)->after('certifications');
            $table->unsignedInteger('certificate_count')->default(0)->after('qualification_rank');
        });

        DB::table('job_seeker_profiles')
            ->orderBy('id')
            ->lazyById()
            ->each(function (object $row): void {
                $education = $this->decodeJson($row->education ?? null);
                $certifications = $this->decodeJson($row->certifications ?? null);

                $profile = new JobSeekerProfile([
                    'education' => $education,
                    'certifications' => $certifications,
                ]);

                DB::table('job_seeker_profiles')
                    ->where('id', $row->id)
                    ->update([
                        'qualification_rank' => ApplicantQualification::rank($profile),
                        'certificate_count' => ApplicantQualification::certificateCount($profile),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('job_seeker_profiles', function (Blueprint $table): void {
            $table->dropColumn(['qualification_rank', 'certificate_count']);
        });
    }

    /**
     * @return array<int, mixed>|null
     */
    private function decodeJson(mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || $value === '') {
            return null;
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : null;
    }
};
