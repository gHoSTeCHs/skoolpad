<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Enums\AccountType;
use App\Enums\ParentalRelationship;
use App\Http\Controllers\Controller;
use App\Http\Requests\ParentDashboard\CreateParentProfileRequest;
use App\Services\ParentAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentOnboardingController extends Controller
{
    public function __construct(
        private readonly ParentAccountService $parentAccountService,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->account_type !== AccountType::Parent) {
            abort(403);
        }

        if ($user->parentProfile) {
            return redirect()->route('parent.dashboard');
        }

        return Inertia::render('parent/onboarding');
    }

    public function store(CreateParentProfileRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->account_type !== AccountType::Parent) {
            abort(403);
        }

        if ($user->parentProfile) {
            return redirect()->route('parent.dashboard');
        }

        $validated = $request->validated();

        $this->parentAccountService->createParentProfile(
            user: $user,
            relationship: ParentalRelationship::from($validated['relationship']),
            phoneNumber: $validated['phone_number'] ?? null,
        );

        return redirect()->route('parent.dashboard');
    }
}
