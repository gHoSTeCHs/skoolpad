<?php

namespace App\Models;

use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicCoverage extends Model
{
    /** @use HasFactory<\Database\Factories\TopicCoverageFactory> */
    use HasFactory, HasUuids;

    protected $table = 'topic_coverage_status';

    protected $fillable = [
        'parent_child_link_id',
        'canonical_topic_id',
        'status',
        'covered_at',
        'source',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => TopicCoverageStatus::class,
            'source' => TopicCoverageSource::class,
            'covered_at' => 'datetime',
        ];
    }

    public function parentChildLink(): BelongsTo
    {
        return $this->belongsTo(ParentChildLink::class);
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }
}
