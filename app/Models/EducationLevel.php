<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EducationLevel extends Model
{
    /** @use HasFactory<\Database\Factories\EducationLevelFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'curriculum_tier_id',
        'name',
        'display_name',
        'sort_order',
        'typical_age_min',
        'typical_age_max',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'typical_age_min' => 'integer',
            'typical_age_max' => 'integer',
        ];
    }

    public function curriculumTier(): BelongsTo
    {
        return $this->belongsTo(CurriculumTier::class);
    }

    public function levelSubjects(): HasMany
    {
        return $this->hasMany(LevelSubject::class);
    }
}
