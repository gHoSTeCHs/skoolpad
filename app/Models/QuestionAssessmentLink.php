<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class QuestionAssessmentLink extends Pivot
{
    protected $table = 'question_assessment_links';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'assessment_type_id',
        'year',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function assessmentType(): BelongsTo
    {
        return $this->belongsTo(AssessmentType::class);
    }
}
