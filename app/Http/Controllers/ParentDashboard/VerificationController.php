<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Enums\ParentChildLinkStatus;
use App\Enums\VerificationResult;
use App\Http\Controllers\Controller;
use App\Http\Requests\ParentDashboard\StoreVerificationRequest;
use App\Http\Resources\VerificationQueueResource;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\StudentProfile;
use App\Services\ParentVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function __construct(
        private readonly ParentVerificationService $verificationService,
    ) {}

    public function index(Request $request, StudentProfile $studentProfile): Response
    {
        $link = $this->getActiveLink($request, $studentProfile);
        $queue = $this->verificationService->getVerificationQueue($link);
        $stats = $this->verificationService->getVerificationStats($link);

        return Inertia::render('parent/verification/index', [
            'child' => [
                'id' => $studentProfile->id,
                'user' => [
                    'id' => $studentProfile->user->id,
                    'name' => $studentProfile->user->name,
                ],
            ],
            'queue' => VerificationQueueResource::collection($queue)->resolve(request()),
            'stats' => $stats,
        ]);
    }

    public function show(Request $request, StudentProfile $studentProfile, CanonicalTopic $topic): Response
    {
        $kit = $this->verificationService->getVerificationKit($topic->id);

        if (! $kit) {
            abort(404);
        }

        return Inertia::render('parent/verification/show', [
            'child' => [
                'id' => $studentProfile->id,
                'user' => [
                    'id' => $studentProfile->user->id,
                    'name' => $studentProfile->user->name,
                ],
            ],
            'kit' => $kit,
        ]);
    }

    public function store(StoreVerificationRequest $request, StudentProfile $studentProfile, CanonicalTopic $topic): RedirectResponse
    {
        $link = $this->getActiveLink($request, $studentProfile);
        $validated = $request->validated();

        $this->verificationService->submitVerification(
            link: $link,
            canonicalTopicId: $topic->id,
            responses: $validated['responses'],
            overallResult: VerificationResult::from($validated['overall_result']),
            notes: $validated['notes'] ?? null,
        );

        return redirect()->route('parent.verification.index', $studentProfile);
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
