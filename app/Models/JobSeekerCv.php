<?php

namespace App\Models;

use Database\Factories\JobSeekerCvFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class JobSeekerCv extends Model
{
    /** @use HasFactory<JobSeekerCvFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'label',
        'file_path',
        'original_name',
        'is_default',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fileExists(): bool
    {
        return filled($this->file_path)
            && Storage::disk('local')->exists((string) $this->file_path);
    }
}
