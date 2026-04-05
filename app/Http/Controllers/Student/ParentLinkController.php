<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\ApproveLinkRequest;
use App\Http\Requests\Student\RevokeLinkRequest;
use App\Models\ParentChildLink;
use App\Services\ParentAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

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
        $link = ParentChildLink::query()->findOrFail($validated['link_id']);

        Gate::authorize('revoke', $link);

        $this->parentAccountService->revokeLinkRequest($link);

        return redirect()->back();
    }
}
