<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CanonicalTopicVisualizationBrief extends Model
{
    /** @use HasFactory<\Database\Factories\CanonicalTopicVisualizationBriefFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'canonical_topic_id',
        'visualization_score',
        'intents_json',
        'computed_at',
        'computed_from_paper_count',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'visualization_score' => 'integer',
            'intents_json' => 'array',
            'computed_at' => 'datetime',
            'computed_from_paper_count' => 'integer',
        ];
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }
}
