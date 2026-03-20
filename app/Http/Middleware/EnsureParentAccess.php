<?php

namespace App\Http\Middleware;

use App\Enums\AccountType;
use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Models\StudentProfile;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureParentAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->account_type !== AccountType::Parent) {
            abort(403);
        }

        if (! $user->parentProfile) {
            abort(403);
        }

        $studentProfile = $request->route('studentProfile');

        if ($studentProfile) {
            $studentProfileId = $studentProfile instanceof StudentProfile
                ? $studentProfile->id
                : $studentProfile;

            $hasActiveLink = ParentChildLink::query()
                ->where('parent_profile_id', $user->parentProfile->id)
                ->where('student_profile_id', $studentProfileId)
                ->where('status', ParentChildLinkStatus::Active)
                ->exists();

            if (! $hasActiveLink) {
                abort(403);
            }
        }

        return $next($request);
    }
}
