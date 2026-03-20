<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\ApproveLinkRequest;
use App\Http\Requests\Student\RevokeLinkRequest;
use App\Services\ParentAccountService;
use Illuminate\Http\RedirectResponse;

class ParentLinkController extends Controller
{
    public function __construct(
        private readonly ParentAccountService $parentAccountService,
    ) {}

    public function approve(ApproveLinkRequest $request): RedirectResponse
    {
        $studentProfile = $request->user()->studentProfile;
        $validated = $request->validated();

        $this->parentAccountService->approveLinkRequest(
            studentProfile: $studentProfile,
            linkId: $validated['link_id'],
        );

        return redirect()->back();
    }

    public function revoke(RevokeLinkRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->parentAccountService->revokeLinkRequest(
            requestingUser: $request->user(),
            linkId: $validated['link_id'],
        );

        return redirect()->back();
    }
}
