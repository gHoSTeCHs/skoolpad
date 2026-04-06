<?php

namespace App\Providers;

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\Discipline;
use App\Models\ImportLog;
use App\Models\InstitutionCourse;
use App\Models\PlatformSetting;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Policies\AdminCoursePolicy;
use App\Policies\ContentPolicy;
use App\Policies\DisciplinePolicy;
use App\Policies\ImportPolicy;
use App\Policies\SubscriptionPolicy;
use App\Policies\UserManagementPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
    }

    protected function registerPolicies(): void
    {
        Gate::policy(ImportLog::class, ImportPolicy::class);
        Gate::policy(User::class, UserManagementPolicy::class);
        Gate::policy(SubscriptionPlan::class, SubscriptionPolicy::class);
        Gate::policy(PlatformSetting::class, SubscriptionPolicy::class);
        Gate::policy(CanonicalTopic::class, ContentPolicy::class);
        Gate::policy(ContentBlock::class, ContentPolicy::class);
        Gate::policy(InstitutionCourse::class, AdminCoursePolicy::class);
        Gate::policy(Discipline::class, DisciplinePolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
