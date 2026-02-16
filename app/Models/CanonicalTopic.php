<?php

namespace App\Models;

use App\Enums\TopicDifficulty;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CanonicalTopic extends Model
{
    /** @use HasFactory<\Database\Factories\CanonicalTopicFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'discipline_id',
        'parent_topic_id',
        'title',
        'slug',
        'content',
        'content_plain',
        'summary',
        'difficulty_level',
        'estimated_read_minutes',
        'language',
        'is_published',
        'published_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'difficulty_level' => TopicDifficulty::class,
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function parentTopic(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_topic_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_topic_id');
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'topic_prerequisites',
            'topic_id',
            'prerequisite_topic_id'
        );
    }

    public function courseTopicMappings(): HasMany
    {
        return $this->hasMany(CourseTopicMapping::class);
    }

    public function questionTopicLinks(): HasMany
    {
        return $this->hasMany(QuestionTopicLink::class);
    }
}
