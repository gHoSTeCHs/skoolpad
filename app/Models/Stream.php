<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stream extends Model
{
    /** @use HasFactory<\Database\Factories\StreamFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'education_system_id',
        'name',
        'applies_from_tier_id',
    ];

    public function educationSystem(): BelongsTo
    {
        return $this->belongsTo(EducationSystem::class);
    }

    public function appliesFromTier(): BelongsTo
    {
        return $this->belongsTo(CurriculumTier::class, 'applies_from_tier_id');
    }

    public function levelSubjects(): HasMany
    {
        return $this->hasMany(LevelSubject::class);
    }
}
