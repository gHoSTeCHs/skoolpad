<?php

namespace App\Models;

use App\Enums\VerificationResult;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationAttempt extends Model
{
    /** @use HasFactory<\Database\Factories\VerificationAttemptFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'parent_child_link_id',
        'canonical_topic_id',
        'responses',
        'overall_result',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'responses' => 'array',
            'overall_result' => VerificationResult::class,
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (VerificationAttempt $model) {
            $model->created_at = $model->freshTimestamp();
        });
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
