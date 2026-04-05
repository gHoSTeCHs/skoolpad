<?php

namespace App\Models;

use App\Enums\BillingPeriod;
use App\Enums\PlanType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    /** @use HasFactory<\Database\Factories\SubscriptionPlanFactory> */
    use HasFactory, HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'display_name',
        'plan_type',
        'price_ngn',
        'price_usd',
        'billing_period',
        'paystack_plan_code',
        'features',
        'max_children',
        'max_students',
        'max_lecturers',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'plan_type' => PlanType::class,
            'billing_period' => BillingPeriod::class,
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function userSubscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class, 'plan_id');
    }
}
