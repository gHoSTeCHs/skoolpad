<?php

namespace App\Models;

use App\Enums\EducationSystemType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EducationSystem extends Model
{
    /** @use HasFactory<\Database\Factories\EducationSystemFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'country_id',
        'system_type',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'system_type' => EducationSystemType::class,
        ];
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'ilike', "%{$term}%");
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function curriculumTiers(): HasMany
    {
        return $this->hasMany(CurriculumTier::class);
    }

    public function streams(): HasMany
    {
        return $this->hasMany(Stream::class);
    }

    public function curriculumSubjects(): HasMany
    {
        return $this->hasMany(CurriculumSubject::class);
    }

    public function assessmentTypes(): HasMany
    {
        return $this->hasMany(AssessmentType::class);
    }

    public function institutions(): BelongsToMany
    {
        return $this->belongsToMany(Institution::class, 'institution_education_systems');
    }
}
