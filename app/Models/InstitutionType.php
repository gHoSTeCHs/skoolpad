<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionType extends Model
{
    /** @use HasFactory<\Database\Factories\InstitutionTypeFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'country_id',
        'name',
        'slug',
        'level_progression',
        'credit_system',
        'grading_scale_id',
        'qualification_names',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'level_progression' => 'array',
            'qualification_names' => 'array',
        ];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function gradingScale(): BelongsTo
    {
        return $this->belongsTo(GradingScale::class);
    }
}
