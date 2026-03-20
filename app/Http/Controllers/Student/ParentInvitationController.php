<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\SendParentInviteRequest;
use App\Services\ParentAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ParentInvitationController extends Controller
{
    public function __construct(
        private readonly ParentAccountService $parentAccountService,
    ) {}

    public function dismiss(Request $request): RedirectResponse
    {
        $request->user()->studentProfile->update(['parent_invite_dismissed_at' => now()]);

        return redirect()->back();
    }

    public function send(SendParentInviteRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->parentAccountService->sendParentInvite(
            studentProfile: $request->user()->studentProfile,
            parentEmail: $validated['parent_email'],
        );

        return redirect()->back();
    }
}
