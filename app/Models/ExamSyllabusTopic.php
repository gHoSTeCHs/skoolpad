<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSyllabusTopic extends Model
{
    /** @use HasFactory<\Database\Factories\ExamSyllabusTopicFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'assessment_subject_id',
        'parent_topic_id',
        'part_label',
        'topic_number',
        'title',
        'notes_md',
        'subtopics_json',
        'source_url',
        'version_year',
        'ingested_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'subtopics_json' => 'array',
            'version_year' => 'integer',
            'ingested_at' => 'datetime',
        ];
    }

    public function assessmentSubject(): BelongsTo
    {
        return $this->belongsTo(AssessmentSubject::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_topic_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_topic_id');
    }
}
