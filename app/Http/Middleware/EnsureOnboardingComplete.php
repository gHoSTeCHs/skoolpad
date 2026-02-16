<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::Student) {
            return $next($request);
        }

        if (! $user->studentProfile) {
            return redirect()->route('onboarding.index');
        }

        return $next($request);
    }
}
