<?php

namespace App\Models;

use App\Enums\BloomLevel;
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
        'question_paper_id',
        'question_section_id',
        'parent_question_id',
        'question_type',
        'question_number',
        'display_label',
        'content',
        'marks',
        'sort_order',
        'depth_level',
        'response_config',
        'choice_group',
        'explanation',
        'difficulty_level',
        'bloom_level',
        'is_published',
        'year',
        'semester',
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
            'difficulty_level' => QuestionDifficulty::class,
            'bloom_level' => BloomLevel::class,
            'source' => QuestionSource::class,
            'status' => QuestionStatus::class,
            'response_config' => 'array',
            'choice_group' => 'array',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
            'depth_level' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function questionPaper(): BelongsTo
    {
        return $this->belongsTo(QuestionPaper::class);
    }

    public function questionSection(): BelongsTo
    {
        return $this->belongsTo(QuestionSection::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_question_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_question_id')->orderBy('sort_order');
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

    public function questionContextLinks(): HasMany
    {
        return $this->hasMany(QuestionContextLink::class);
    }

    public function contexts(): BelongsToMany
    {
        return $this->belongsToMany(
            QuestionContext::class,
            'question_context_links',
            'question_id',
            'question_context_id'
        )->using(QuestionContextLink::class)->withPivot('sort_order', 'label');
    }

    public function questionBlockLinks(): HasMany
    {
        return $this->hasMany(QuestionBlockLink::class);
    }

    public function contentBlocks(): BelongsToMany
    {
        return $this->belongsToMany(
            ContentBlock::class,
            'question_block_links',
            'question_id',
            'content_block_id'
        )->using(QuestionBlockLink::class)->withPivot('relevance');
    }

    public function questionAssessmentLinks(): HasMany
    {
        return $this->hasMany(QuestionAssessmentLink::class);
    }

    public function assessmentTypes(): BelongsToMany
    {
        return $this->belongsToMany(
            AssessmentType::class,
            'question_assessment_links',
            'question_id',
            'assessment_type_id'
        )->using(QuestionAssessmentLink::class)->withPivot('year');
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
