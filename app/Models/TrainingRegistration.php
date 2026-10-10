<?php

namespace App\Models;

use App\Enums\TrainingRegistrationStatus;
use Database\Factories\TrainingRegistrationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TrainingRegistration extends Model
{
    /** @use HasFactory<TrainingRegistrationFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'training_course_id',
        'user_id',
        'registration_number',
        'public_token',
        'full_name',
        'email',
        'phone',
        'country_city',
        'organization',
        'job_title',
        'experience',
        'reason',
        'answers',
        'consent_accepted_at',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'consent_accepted_at' => 'datetime',
            'status' => TrainingRegistrationStatus::class,
        ];
    }

    /**
     * @return BelongsTo<TrainingCourse, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(TrainingCourse::class, 'training_course_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function nextRegistrationNumber(): string
    {
        $prefix = 'TR-'.now()->format('Y').'-';

        $latest = static::query()
            ->where('registration_number', 'like', $prefix.'%')
            ->orderByDesc('registration_number')
            ->value('registration_number');

        $sequence = 1;

        if (is_string($latest) && preg_match('/(\d+)$/', $latest, $matches) === 1) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }

    public static function newPublicToken(): string
    {
        return (string) Str::ulid();
    }
}
