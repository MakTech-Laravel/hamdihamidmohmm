<?php

namespace App\Models;

use App\Enums\ContentPageStatus;
use App\Enums\ContentPageType;
use Database\Factories\ContentPageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ContentPage extends Model
{
    /** @use HasFactory<ContentPageFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'type',
        'body',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ContentPageType::class,
            'status' => ContentPageStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ContentPage $page): void {
            if (blank($page->slug)) {
                $page->slug = Str::slug($page->title).'-'.Str::lower(Str::random(4));
            }
        });
    }
}
