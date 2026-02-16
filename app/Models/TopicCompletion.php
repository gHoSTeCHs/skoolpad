<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicCompletion extends Model
{
    /** @use HasFactory<\Database\Factories\TopicCompletionFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'canonical_topic_id',
        'completed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }
}
