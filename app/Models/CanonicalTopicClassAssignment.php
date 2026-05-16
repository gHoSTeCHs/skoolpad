<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CanonicalTopicClassAssignment extends Model
{
    /** @use HasFactory<\Database\Factories\CanonicalTopicClassAssignmentFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'canonical_topic_id',
        'education_level_id',
        'depth',
        'term_index',
        'is_primary',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'term_index' => 'integer',
        ];
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }
}
