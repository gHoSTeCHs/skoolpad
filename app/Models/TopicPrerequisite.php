<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicPrerequisite extends Model
{
    /** @use HasFactory<\Database\Factories\TopicPrerequisiteFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'topic_id',
        'prerequisite_topic_id',
        'is_hard_prerequisite',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_hard_prerequisite' => 'boolean',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class, 'topic_id');
    }

    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class, 'prerequisite_topic_id');
    }
}
