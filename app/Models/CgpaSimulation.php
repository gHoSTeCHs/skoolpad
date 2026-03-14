<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CgpaSimulation extends Model
{
    /** @use HasFactory<\Database\Factories\CgpaSimulationFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'name',
        'mode',
        'grading_scale_id',
        'current_cgpa',
        'current_credit_hours',
        'projected_grades',
        'projected_cgpa',
        'semester_data',
        'target_cgpa',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'current_cgpa' => 'decimal:2',
            'projected_cgpa' => 'decimal:2',
            'target_cgpa' => 'decimal:2',
            'current_credit_hours' => 'integer',
            'projected_grades' => 'array',
            'semester_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gradingScale(): BelongsTo
    {
        return $this->belongsTo(GradingScale::class);
    }
}
