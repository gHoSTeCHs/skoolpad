<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    /** @use HasFactory<\Database\Factories\DepartmentFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'faculty_id',
        'name',
        'abbreviation',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function courseDepartmentOfferings(): HasMany
    {
        return $this->hasMany(CourseDepartmentOffering::class);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'ilike', "%{$term}%");
    }
}
