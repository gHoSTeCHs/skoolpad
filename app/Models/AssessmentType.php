<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentType extends Model
{
    /** @use HasFactory<\Database\Factories\AssessmentTypeFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'education_system_id',
        'name',
        'slug',
        'tier_id',
        'is_exit_exam',
        'is_entrance_exam',
        'grading_scale_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_exit_exam' => 'boolean',
            'is_entrance_exam' => 'boolean',
        ];
    }

    public function educationSystem(): BelongsTo
    {
        return $this->belongsTo(EducationSystem::class);
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(CurriculumTier::class, 'tier_id');
    }

    public function gradingScale(): BelongsTo
    {
        return $this->belongsTo(GradingScale::class);
    }
}
