<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudyGroup extends Model
{
    /** @use HasFactory<\Database\Factories\StudyGroupFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'owner_id',
        'subscription_id',
        'max_members',
        'invite_code',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(UserSubscription::class, 'subscription_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(StudyGroupMember::class);
    }
}
