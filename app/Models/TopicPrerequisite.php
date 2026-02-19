<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class TopicPrerequisite extends Pivot
{
    use HasUuids;

    protected $table = 'topic_prerequisites';

    public $incrementing = false;

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
