<?php

namespace App\Models;

use App\Enums\EmployerPackage;
use Database\Factories\PackageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Package extends Model
{
    /** @use HasFactory<PackageFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'price',
        'currency',
        'billing_period',
        'job_credits',
        'featured_credits',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'job_credits' => 'integer',
            'featured_credits' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function enum(): ?EmployerPackage
    {
        return EmployerPackage::tryFrom($this->slug);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
