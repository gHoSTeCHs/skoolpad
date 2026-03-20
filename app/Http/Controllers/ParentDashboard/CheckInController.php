<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Enums\ParentChildLinkStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ParentDashboard\CompleteCheckInRequest;
use App\Http\Resources\CheckInSessionResource;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\StudentProfile;
use App\Services\ParentCheckInService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    public function __construct(
        private readonly ParentCheckInService $checkInService,
    ) {}

    public function show(Request $request, StudentProfile $studentProfile): Response
    {
        $link = $this->getActiveLink($request, $studentProfile);
        $checkIn = $this->checkInService->getOrCreateTonightsCheckIn($link);

        return Inertia::render('parent/check-in/show', [
            'child' => [
                'id' => $studentProfile->id,
                'name' => $studentProfile->user->name,
            ],
            'checkIn' => (new CheckInSessionResource($checkIn))->resolve(request()),
        ]);
    }

    public function complete(CompleteCheckInRequest $request, StudentProfile $studentProfile): RedirectResponse
    {
        $link = $this->getActiveLink($request, $studentProfile);
        $checkIn = $this->checkInService->getOrCreateTonightsCheckIn($link);
        $validated = $request->validated();

        $this->checkInService->completeCheckIn($checkIn, $validated['completed_items']);

        return redirect()->route('parent.children.dashboard', $studentProfile);
    }

    public function readTogether(Request $request, StudentProfile $studentProfile, CanonicalTopic $topic): Response
    {
        $this->getActiveLink($request, $studentProfile);
        $content = $this->checkInService->getReadTogetherContent($topic->id);

        return Inertia::render('parent/check-in/read-together', [
            'child' => [
                'id' => $studentProfile->id,
                'name' => $studentProfile->user->name,
            ],
            'content' => $content,
        ]);
    }

    public function studyAsChild(Request $request, StudentProfile $studentProfile): Response
    {
        $link = $this->getActiveLink($request, $studentProfile);
        $context = $this->checkInService->initStudyAsChildSession($link);

        return Inertia::render('parent/study-as-child', [
            'context' => $context,
        ]);
    }

    private function getActiveLink(Request $request, StudentProfile $studentProfile): ParentChildLink
    {
        $parentProfile = $request->user()->parentProfile;

        return ParentChildLink::query()
            ->where('parent_profile_id', $parentProfile->id)
            ->where('student_profile_id', $studentProfile->id)
            ->where('status', ParentChildLinkStatus::Active)
            ->firstOrFail();
    }
}
