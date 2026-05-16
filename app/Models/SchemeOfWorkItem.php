<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchemeOfWorkItem extends Model
{
    /** @use HasFactory<\Database\Factories\SchemeOfWorkItemFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'curriculum_subject_level_id',
        'source_type',
        'source_url',
        'source_version_year',
        'source_meta',
        'term',
        'week_number',
        'topic_label',
        'canonical_topic_id',
        'content_block_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'term' => 'integer',
            'week_number' => 'integer',
            'source_version_year' => 'integer',
            'source_meta' => 'array',
        ];
    }

    public function levelSubject(): BelongsTo
    {
        return $this->belongsTo(LevelSubject::class, 'curriculum_subject_level_id');
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }

    public function contentBlock(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class);
    }
}
