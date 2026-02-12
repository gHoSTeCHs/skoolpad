<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    public function handle(Request $request, Closure $next): Response
    {
        $appearance = $request->cookie('appearance') ?? 'system';

        if ($user = $request->user()) {
            $dbAppearance = $user->preference?->appearance;

            if ($dbAppearance && $dbAppearance !== $appearance) {
                $appearance = $dbAppearance;
            }
        }

        View::share('appearance', $appearance);

        $response = $next($request);

        if ($user && isset($dbAppearance) && $dbAppearance && $dbAppearance !== $request->cookie('appearance')) {
            $response->headers->setCookie(
                cookie('appearance', $dbAppearance, 525600, '/', null, false, false, false, 'Lax')
            );
        }

        return $response;
    }
}
