<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumTier extends Model
{
    /** @use HasFactory<\Database\Factories\CurriculumTierFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'education_system_id',
        'name',
        'slug',
        'sort_order',
        'is_tertiary',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_tertiary' => 'boolean',
        ];
    }

    public function educationSystem(): BelongsTo
    {
        return $this->belongsTo(EducationSystem::class);
    }

    public function educationLevels(): HasMany
    {
        return $this->hasMany(EducationLevel::class);
    }

    public function streams(): HasMany
    {
        return $this->hasMany(Stream::class, 'applies_from_tier_id');
    }
}
