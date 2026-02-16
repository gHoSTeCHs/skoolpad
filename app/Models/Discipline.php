<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Discipline extends Model
{
    /** @use HasFactory<\Database\Factories\DisciplineFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
    ];

    public function canonicalTopics(): HasMany
    {
        return $this->hasMany(CanonicalTopic::class);
    }
}
