<?php

namespace App\Models;

use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'institution_course_id',
        'exam_subject_id',
        'question_type',
        'content',
        'year',
        'semester',
        'marks',
        'difficulty_level',
        'attempt_count',
        'correct_count',
        'avg_time_seconds',
        'source',
        'status',
        'created_by',
        'reviewed_by',
        'published_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'question_type' => QuestionType::class,
            'semester' => 'string',
            'difficulty_level' => QuestionDifficulty::class,
            'source' => QuestionSource::class,
            'status' => QuestionStatus::class,
            'published_at' => 'datetime',
        ];
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function examSubject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuestionAnswer::class);
    }

    public function topicLinks(): HasMany
    {
        return $this->hasMany(QuestionTopicLink::class);
    }

    public function canonicalTopics(): BelongsToMany
    {
        return $this->belongsToMany(
            CanonicalTopic::class,
            'question_topic_links',
            'question_id',
            'canonical_topic_id'
        );
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->whereRaw("search_vector @@ plainto_tsquery('english', ?)", [$term]);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', QuestionStatus::Published);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('question_type', $type);
    }

    public function scopeByDifficulty(Builder $query, string $difficulty): Builder
    {
        return $query->where('difficulty_level', $difficulty);
    }

    public function scopeBySource(Builder $query, string $source): Builder
    {
        return $query->where('source', $source);
    }

    public function scopeByYear(Builder $query, int $year): Builder
    {
        return $query->where('year', $year);
    }

    public function scopeBySemester(Builder $query, string $semester): Builder
    {
        return $query->where('semester', $semester);
    }

    public function scopeForCourse(Builder $query, string $courseId): Builder
    {
        return $query->where('institution_course_id', $courseId);
    }

    public function scopeForInstitution(Builder $query, string $institutionId): Builder
    {
        return $query->whereHas('institutionCourse', fn (Builder $q) => $q->where('institution_id', $institutionId));
    }
}
