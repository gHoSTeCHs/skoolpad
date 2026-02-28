<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentSubject extends Model
{
    /** @use HasFactory<\Database\Factories\AssessmentSubjectFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'assessment_type_id',
        'name',
        'slug',
        'is_compulsory',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_compulsory' => 'boolean',
        ];
    }

    public function assessmentType(): BelongsTo
    {
        return $this->belongsTo(AssessmentType::class);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'ilike', "%{$term}%");
    }
}
