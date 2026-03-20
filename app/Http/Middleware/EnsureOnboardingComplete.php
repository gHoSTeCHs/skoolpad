<?php

namespace App\Http\Middleware;

use App\Enums\AccountType;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->account_type === AccountType::Parent) {
            if (! $user->parentProfile) {
                return redirect()->route('parent.onboarding');
            }

            if (! str_starts_with($request->path(), 'parent/')) {
                return redirect()->route('parent.dashboard');
            }

            return $next($request);
        }

        if ($user->role !== UserRole::Student) {
            return $next($request);
        }

        if (! $user->studentProfile) {
            return redirect()->route('onboarding.index');
        }

        return $next($request);
    }
}
