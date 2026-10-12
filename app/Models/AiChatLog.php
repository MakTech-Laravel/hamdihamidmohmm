<?php

namespace App\Models;

use App\Enums\AiChatChannel;
use App\Enums\AiChatStatus;
use Database\Factories\AiChatLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiChatLog extends Model
{
    /** @use HasFactory<AiChatLogFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'channel',
        'session_key',
        'locale',
        'question',
        'answer',
        'status',
        'input_tokens',
        'output_tokens',
        'duration_ms',
        'error',
        'ip_address',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'channel' => AiChatChannel::class,
            'status' => AiChatStatus::class,
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'duration_ms' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
