<?php

namespace App\Models;

use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    /** @use HasFactory<\Database\Factories\InstitutionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'country_id',
        'name',
        'abbreviation',
        'institution_type',
        'institution_type_id',
        'grading_scale_id',
        'ownership_type',
        'state',
        'city',
        'website',
        'logo_path',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'institution_type' => InstitutionType::class,
            'ownership_type' => OwnershipType::class,
            'is_active' => 'boolean',
        ];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function faculties(): HasMany
    {
        return $this->hasMany(Faculty::class);
    }

    public function institutionCourses(): HasMany
    {
        return $this->hasMany(InstitutionCourse::class);
    }

    public function institutionTypeModel(): BelongsTo
    {
        return $this->belongsTo(\App\Models\InstitutionType::class, 'institution_type_id');
    }

    public function gradingScale(): BelongsTo
    {
        return $this->belongsTo(GradingScale::class);
    }

    public function educationSystems(): BelongsToMany
    {
        return $this->belongsToMany(EducationSystem::class, 'institution_education_systems');
    }

    public function calendarTerms(): HasMany
    {
        return $this->hasMany(CalendarTerm::class);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
                ->orWhere('abbreviation', 'ilike', "%{$term}%");
        });
    }
}
