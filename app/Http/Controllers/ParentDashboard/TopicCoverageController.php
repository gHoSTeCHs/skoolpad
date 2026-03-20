<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Enums\ParentChildLinkStatus;
use App\Enums\TopicCoverageStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ParentDashboard\ReportTopicCoverageRequest;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\StudentProfile;
use App\Services\ParentCheckInService;
use Illuminate\Http\RedirectResponse;

class TopicCoverageController extends Controller
{
    public function __construct(
        private readonly ParentCheckInService $checkInService,
    ) {}

    public function store(
        ReportTopicCoverageRequest $request,
        StudentProfile $studentProfile,
        CanonicalTopic $topic,
    ): RedirectResponse {
        $parentProfile = $request->user()->parentProfile;

        $link = ParentChildLink::query()
            ->where('parent_profile_id', $parentProfile->id)
            ->where('student_profile_id', $studentProfile->id)
            ->where('status', ParentChildLinkStatus::Active)
            ->firstOrFail();

        $this->checkInService->reportTopicCoverage(
            parentChildLinkId: $link->id,
            canonicalTopicId: $topic->id,
            status: TopicCoverageStatus::from($request->validated('status')),
        );

        return redirect()->back();
    }
}
