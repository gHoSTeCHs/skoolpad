<?php

namespace App\Models;

use App\Enums\PracticeMode;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeSession extends Model
{
    /** @use HasFactory<\Database\Factories\PracticeSessionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'institution_course_id',
        'canonical_topic_id',
        'assessment_type_id',
        'question_paper_id',
        'mode',
        'question_count',
        'correct_count',
        'total_time_seconds',
        'time_limit_seconds',
        'score_percentage',
        'tier_at_creation',
        'is_resumable',
        'last_activity_at',
        'completed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'mode' => PracticeMode::class,
            'is_resumable' => 'boolean',
            'last_activity_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }

    public function assessmentType(): BelongsTo
    {
        return $this->belongsTo(AssessmentType::class);
    }

    public function questionPaper(): BelongsTo
    {
        return $this->belongsTo(QuestionPaper::class);
    }

    public function practiceAnswers(): HasMany
    {
        return $this->hasMany(PracticeAnswer::class);
    }
}
