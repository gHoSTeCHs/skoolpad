<?php

namespace App\Models;

use App\Enums\ParentChildLinkStatus;
use App\Enums\Term;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParentChildLink extends Model
{
    /** @use HasFactory<\Database\Factories\ParentChildLinkFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'parent_profile_id',
        'parent_email',
        'student_profile_id',
        'status',
        'linked_at',
        'data_consent_granted_at',
        'study_goal_minutes',
        'current_term',
        'term_start_date',
        'grace_period_ends_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => ParentChildLinkStatus::class,
            'linked_at' => 'datetime',
            'data_consent_granted_at' => 'datetime',
            'study_goal_minutes' => 'integer',
            'created_at' => 'datetime',
            'current_term' => Term::class,
            'term_start_date' => 'date',
            'grace_period_ends_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ParentChildLink $model) {
            $model->created_at = $model->freshTimestamp();
        });
    }

    public function parentProfile(): BelongsTo
    {
        return $this->belongsTo(ParentProfile::class);
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function verificationAttempts(): HasMany
    {
        return $this->hasMany(VerificationAttempt::class);
    }

    public function topicCoverages(): HasMany
    {
        return $this->hasMany(TopicCoverage::class);
    }

    public function checkInSessions(): HasMany
    {
        return $this->hasMany(ParentCheckInSession::class);
    }
}
