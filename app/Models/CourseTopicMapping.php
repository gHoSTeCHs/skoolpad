<?php

namespace App\Models;

use App\Enums\TopicWeight;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseTopicMapping extends Model
{
    /** @use HasFactory<\Database\Factories\CourseTopicMappingFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'institution_course_id',
        'canonical_topic_id',
        'sequence_order',
        'weight',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'weight' => TopicWeight::class,
        ];
    }

    public function institutionCourse(): BelongsTo
    {
        return $this->belongsTo(InstitutionCourse::class);
    }

    public function canonicalTopic(): BelongsTo
    {
        return $this->belongsTo(CanonicalTopic::class);
    }
}
