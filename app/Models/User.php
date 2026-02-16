<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasUuids, Notifiable, TwoFactorAuthenticatable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'secondary_role',
        'avatar_path',
        'app_pin_hash',
        'app_preferences',
        'is_active',
        'last_login_at',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'app_pin_hash',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'secondary_role' => UserRole::class,
            'app_preferences' => 'array',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function preference(): HasOne
    {
        return $this->hasOne(UserPreference::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function practiceSessions(): HasMany
    {
        return $this->hasMany(PracticeSession::class);
    }

    public function studentNotes(): HasMany
    {
        return $this->hasMany(StudentNote::class);
    }

    public function contentSubmissions(): HasMany
    {
        return $this->hasMany(ContentSubmission::class, 'submitted_by');
    }

    public function spacedRepetitionItems(): HasMany
    {
        return $this->hasMany(SpacedRepetitionItem::class);
    }

    public function userLevel(): HasOne
    {
        return $this->hasOne(UserLevel::class);
    }

    public function xpTransactions(): HasMany
    {
        return $this->hasMany(XpTransaction::class);
    }

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    public function contributionStat(): HasOne
    {
        return $this->hasOne(ContributionStat::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(UserSubscription::class)->where('status', 'active');
    }

    public function cgpaSimulations(): HasMany
    {
        return $this->hasMany(CgpaSimulation::class);
    }

    public function leaderboards(): HasMany
    {
        return $this->hasMany(Leaderboard::class);
    }
}
