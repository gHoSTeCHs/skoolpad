<?php

namespace App\Models;

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContentBlock extends Model
{
    /** @use HasFactory<\Database\Factories\ContentBlockFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'canonical_topic_id',
        'parent_block_id',
        'title',
        'slug',
        'block_type',
        'path',
        'depth_level',
        'sort_order',
        'content',
        'simplified_content',
        'estimated_read_time',
        'difficulty_level',
        'bloom_level',
        'is_container',
        'is_published',
        'visualization_config',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'block_type' => BlockType::class,
            'depth_level' => 'integer',
            'sort_order' => 'integer',
            'content' => 'array',
            'simplified_content' => 'array',
            'estimated_read_time' => 'integer',
            'difficulty_level' => BlockDifficultyLevel::class,
            'bloom_level' => BloomLevel::class,
            'is_container' => 'boolean',
            'is_published' => 'boolean',
            'visualization_config' => 'array',
        ];
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class, 'parent_block_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ContentBlock::class, 'parent_block_id');
    }

    public function courseBlockMappings(): HasMany
    {
        return $this->hasMany(CourseBlockMapping::class);
    }

    public function schemeOfWorkItems(): HasMany
    {
        return $this->hasMany(SchemeOfWorkItem::class);
    }

    public function questionBlockLinks(): HasMany
    {
        return $this->hasMany(QuestionBlockLink::class);
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'block_prerequisites',
            'block_id',
            'prerequisite_block_id'
        )->using(BlockPrerequisite::class)->withPivot('is_hard_prerequisite');
    }

    public function requiredBy(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'block_prerequisites',
            'prerequisite_block_id',
            'block_id'
        )->using(BlockPrerequisite::class)->withPivot('is_hard_prerequisite');
    }

    /**
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

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('title', 'ilike', "%{$term}%");
    }
}
