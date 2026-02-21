<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Monetization
    |--------------------------------------------------------------------------
    |
    | This setting determines whether subscription-based tier gating is active.
    | When false, all users receive the free tier experience (Quick answers only).
    | When true, answer depth is restricted based on subscription plan.
    |
    */

    'monetization_enabled' => env('SKOOLPAD_MONETIZATION_ENABLED', false),
];
