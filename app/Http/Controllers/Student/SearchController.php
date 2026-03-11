<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchService $searchService
    ) {}

    public function index(): Response
    {
        return Inertia::render('search/index');
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->toString();

        if (strlen($query) < 2) {
            return response()->json([
                'topics' => [],
                'courses' => [],
                'questions' => [],
                'notes' => [],
                'total' => 0,
            ]);
        }

        $user = $request->user();
        $profile = $user->studentProfile;
        $institutionId = $profile?->institution_id;

        $results = $this->searchService->search($query, $user->id, $institutionId);

        return response()->json($results);
    }
}
