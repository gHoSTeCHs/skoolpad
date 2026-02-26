<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionPaper extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionPaperFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'institution_course_id',
        'assessment_type_id',
        'title',
        'academic_session',
        'semester',
        'year',
        'total_marks',
        'duration_minutes',
        'instructions',
        'is_published',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'total_marks' => 'integer',
            'duration_minutes' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('title', 'ilike', "%{$term}%");
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function assessmentType(): BelongsTo
    {
        return $this->belongsTo(AssessmentType::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(QuestionSection::class);
    }

    public function contexts(): HasMany
    {
        return $this->hasMany(QuestionContext::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
