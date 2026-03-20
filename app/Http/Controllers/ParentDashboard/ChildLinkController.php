<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParentDashboard\CreateChildAccountRequest;
use App\Http\Requests\ParentDashboard\LinkChildRequest;
use App\Models\StudentProfile;
use App\Services\ParentAccountService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ChildLinkController extends Controller
{
    public function __construct(
        private readonly ParentAccountService $parentAccountService,
    ) {}

    public function create(): Response
    {
        return Inertia::render('parent/children/add');
    }

    public function storeChild(CreateChildAccountRequest $request): RedirectResponse
    {
        $parentProfile = $request->user()->parentProfile;
        $validated = $request->validated();

        $this->parentAccountService->createChildAccount(
            parentProfile: $parentProfile,
            childName: $validated['child_name'],
            childEmail: $validated['child_email'],
            childPassword: $validated['child_password'],
            educationLevelId: $validated['education_level_id'],
            subjects: $validated['subjects'] ?? [],
        );

        return redirect()->route('parent.dashboard');
    }

    public function showLinkForm(): Response
    {
        return Inertia::render('parent/children/link');
    }

    public function linkChild(LinkChildRequest $request): RedirectResponse
    {
        $parentProfile = $request->user()->parentProfile;
        $validated = $request->validated();

        $this->parentAccountService->linkParentToStudent(
            parentProfile: $parentProfile,
            inviteCode: $validated['invite_code'],
        );

        return redirect()->route('parent.dashboard');
    }

    public function childDashboard(StudentProfile $studentProfile): Response
    {
        return Inertia::render('parent/child-dashboard', [
            'child' => $studentProfile->load('user'),
        ]);
    }
}
