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
        'current_cgpa',
        'current_credit_hours',
        'projected_grades',
        'projected_cgpa',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'projected_grades' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
