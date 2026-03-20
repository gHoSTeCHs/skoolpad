<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\CheckInSessionResource;
use App\Http\Resources\ExamReadinessResource;
use App\Http\Resources\LinkedChildResource;
use App\Services\ExamReadinessService;
use App\Services\ParentAccountService;
use App\Services\ParentCheckInService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentDashboardController extends Controller
{
    public function __construct(
        private readonly ParentAccountService $parentAccountService,
        private readonly ParentCheckInService $checkInService,
        private readonly ExamReadinessService $readinessService,
    ) {}

    public function index(Request $request): Response
    {
        $parentProfile = $request->user()->parentProfile;
        $summary = $this->parentAccountService->getParentDashboardSummary($parentProfile);

        $children = $summary['children'];
        $selectedLink = $children->first();

        $checkIn = null;
        $readinessScores = collect();

        if ($selectedLink) {
            $checkIn = $this->checkInService->getOrCreateTonightsCheckIn($selectedLink);

            $childUser = $selectedLink->studentProfile->user;
            $readinessScores = $this->readinessService
                ->getCachedReadiness($childUser)
                ->load('levelSubject.curriculumSubject');
        }

        return Inertia::render('parent/dashboard', [
            'children' => LinkedChildResource::collection($children)->resolve(request()),
            'subscription_status' => $summary['subscription_status'],
            'check_in' => $checkIn ? (new CheckInSessionResource($checkIn))->resolve(request()) : null,
            'readiness_scores' => ExamReadinessResource::collection($readinessScores)->resolve(request()),
            'subject_strengths' => [],
            'weekly_summary' => null,
            'streak' => null,
            'daily_activity' => null,
        ]);
    }
}
