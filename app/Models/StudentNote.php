<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNote extends Model
{
    /** @use HasFactory<\Database\Factories\StudentNoteFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'canonical_topic_id',
        'institution_course_id',
        'title',
        'content',
        'is_pinned',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'is_pinned' => 'boolean',
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

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }
}
