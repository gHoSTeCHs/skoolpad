<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSubscription extends Model
{
    /** @use HasFactory<\Database\Factories\UserSubscriptionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'plan_id',
        'paid_by',
        'status',
        'past_due_since',
        'paused_reason',
        'paystack_subscription_code',
        'paystack_customer_code',
        'current_period_start',
        'current_period_end',
        'cancelled_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'past_due_since' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }
}
