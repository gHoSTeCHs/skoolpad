<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnswerDepthLevel;
use App\Http\Controllers\Controller;
use App\Jobs\RunAnswerGeneration;
use App\Models\Question;
use App\Services\Admin\AnswerGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class AnswerGenerationController extends Controller
{
    public function __construct(
        private readonly AnswerGenerationService $service,
    ) {}

    public function plan(Question $question, string $depth): JsonResponse
    {
        Gate::authorize('manageAnswers', Question::class);

        $depthLevel = AnswerDepthLevel::tryFrom($depth);
        if ($depthLevel === null) {
            return response()->json(['message' => "Invalid depth: {$depth}"], 422);
        }

        try {
            $plan = $this->service->plan($question, $depthLevel);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($plan);
    }

    public function generate(Request $request, Question $question, string $depth): JsonResponse
    {
        Gate::authorize('manageAnswers', Question::class);

        $depthLevel = AnswerDepthLevel::tryFrom($depth);
        if ($depthLevel === null) {
            return response()->json(['message' => "Invalid depth: {$depth}"], 422);
        }

        $proseOutline = $request->input('prose_outline', []);

        $jobId = (string) Str::uuid();

        RunAnswerGeneration::dispatch($question, $depthLevel, $jobId, $proseOutline);

        return response()->json(['job_id' => $jobId]);
    }
}
