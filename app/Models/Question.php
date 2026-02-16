<?php

namespace App\Models;

use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Semester;
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
            'semester' => Semester::class,
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

    public function questionOptions(): HasMany
    {
        return $this->hasMany(QuestionOption::class);
    }

    public function questionAnswers(): HasMany
    {
        return $this->hasMany(QuestionAnswer::class);
    }

    public function questionTopicLinks(): HasMany
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
}
