<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Badge extends Model
{
    /** @use HasFactory<\Database\Factories\BadgeFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'slug',
        'name',
        'description',
        'icon_path',
        'requirement_type',
        'requirement_value',
        'requirement_subject_id',
        'education_level',
    ];

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }
}
