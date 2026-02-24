<?php

namespace App\Models;

use App\Enums\TopicDifficulty;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

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
        'education_level',
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
            'education_level' => 'string',
            'exam_frequency_score' => 'decimal:4',
            'parent_verification_kit' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $topic) {
            if (empty($topic->slug)) {
                $topic->slug = Str::slug($topic->title);
            }
        });
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function parent(): BelongsTo
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
        )->using(TopicPrerequisite::class)->withPivot('is_hard_prerequisite');
    }

    public function requiredBy(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'topic_prerequisites',
            'prerequisite_topic_id',
            'topic_id'
        )->using(TopicPrerequisite::class)->withPivot('is_hard_prerequisite');
    }

    public function courseMappings(): HasMany
    {
        return $this->hasMany(CourseTopicMapping::class, 'canonical_topic_id');
    }

    public function questionTopicLinks(): HasMany
    {
        return $this->hasMany(QuestionTopicLink::class);
    }

    public function contentBlocks(): HasMany
    {
        return $this->hasMany(ContentBlock::class);
    }

    public function schemeOfWorkItems(): HasMany
    {
        return $this->hasMany(SchemeOfWorkItem::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeForDiscipline(Builder $query, string $disciplineId): Builder
    {
        return $query->where('discipline_id', $disciplineId);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('title', 'ilike', "%{$term}%");
    }

    /**
     * Sync prerequisites with pivot data
     *
     * @param  array<array{id: string, is_hard_prerequisite: bool}>  $prerequisites
     */
    public function syncPrerequisites(array $prerequisites): void
    {
        $this->prerequisites()->sync(
            collect($prerequisites)->mapWithKeys(fn ($p) => [
                $p['id'] => ['is_hard_prerequisite' => $p['is_hard_prerequisite']],
            ])->all()
        );
    }
}
