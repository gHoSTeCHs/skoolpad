<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudyGroupMember extends Model
{
    /** @use HasFactory<\Database\Factories\StudyGroupMemberFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'study_group_id',
        'user_id',
        'joined_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    public function studyGroup(): BelongsTo
    {
        return $this->belongsTo(StudyGroup::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
