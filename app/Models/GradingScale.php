<?php

namespace App\Models;

use App\Enums\ScaleType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradingScale extends Model
{
    /** @use HasFactory<\Database\Factories\GradingScaleFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'scale_type',
        'scale_min',
        'scale_max',
        'pass_threshold',
        'grade_boundaries',
        'classification_labels',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'scale_type' => ScaleType::class,
            'scale_min' => 'decimal:2',
            'scale_max' => 'decimal:2',
            'pass_threshold' => 'decimal:2',
            'grade_boundaries' => 'array',
            'classification_labels' => 'array',
        ];
    }

    public function assessmentTypes(): HasMany
    {
        return $this->hasMany(AssessmentType::class);
    }

    public function institutionTypes(): HasMany
    {
        return $this->hasMany(InstitutionType::class);
    }
}
