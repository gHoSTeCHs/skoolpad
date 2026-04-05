<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\SearchRequest;
use App\Services\Student\SearchService;
use Illuminate\Http\JsonResponse;
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

    public function search(SearchRequest $request): JsonResponse
    {
        $user = $request->user()->loadMissing('studentProfile');
        $profile = $user->studentProfile;

        $results = $this->searchService->search(
            $request->validated('q'),
            $user->id,
            $profile?->institution_id,
        );

        return response()->json($results);
    }
}
