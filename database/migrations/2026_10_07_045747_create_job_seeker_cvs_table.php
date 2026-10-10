<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_seeker_cvs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_default']);
        });

        $users = DB::table('users')
            ->whereNotNull('resume_path')
            ->where('resume_path', '!=', '')
            ->select(['id', 'resume_path', 'resume_original_name'])
            ->get();

        foreach ($users as $user) {
            DB::table('job_seeker_cvs')->insert([
                'user_id' => $user->id,
                'label' => 'Primary CV',
                'file_path' => $user->resume_path,
                'original_name' => $user->resume_original_name,
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_seeker_cvs');
    }
};
