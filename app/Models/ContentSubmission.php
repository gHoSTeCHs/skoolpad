<?php

namespace App\Models;

use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\Semester;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentSubmission extends Model
{
    /** @use HasFactory<\Database\Factories\ContentSubmissionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'submitted_by',
        'submission_type',
        'related_question_id',
        'related_topic_id',
        'content',
        'images',
        'institution_course_id',
        'exam_year',
        'exam_semester',
        'status',
        'reviewer_id',
        'reviewer_notes',
        'reviewed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'submission_type' => ContentSubmissionType::class,
            'status' => ContentSubmissionStatus::class,
            'exam_semester' => Semester::class,
            'content' => 'array',
            'images' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function relatedQuestion(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'related_question_id');
    }

    public function relatedTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class, 'related_topic_id');
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }
}
