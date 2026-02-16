<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionTopicLink extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionTopicLinkFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'question_id',
        'canonical_topic_id',
        'is_primary',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }
}
