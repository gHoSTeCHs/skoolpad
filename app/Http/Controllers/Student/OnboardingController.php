<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\CompleteOnboardingRequest;
use App\Http\Requests\Student\CourseSuggestionsRequest;
use App\Http\Requests\Student\SearchCoursesRequest;
use App\Models\AssessmentType;
use App\Models\Country;
use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\Stream;
use App\Services\Student\CourseSuggestionService;
use App\Services\Student\OnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly OnboardingService $onboardingService,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()->studentProfile) {
            return redirect()->route('dashboard');
        }

        $countries = Country::query()
            ->whereHas('educationSystems', fn ($q) => $q->whereHas('curriculumTiers', fn ($t) => $t->where('is_tertiary', false)))
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('onboarding/index', [
            'semester' => $this->onboardingService->currentSemester(),
            'academic_year' => $this->onboardingService->currentAcademicYear(),
            'countries' => $countries,
        ]);
    }

    public function store(CompleteOnboardingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($validated['student_type'] === 'tertiary') {
            $this->onboardingService->createTertiaryProfile($request->user(), $validated);
        } else {
            $this->onboardingService->createSecondaryProfile($request->user(), $validated);
        }

        return redirect()->route('dashboard');
    }

    public function searchInstitutions(Request $request): JsonResponse
    {
        $results = Institution::query()
            ->where('is_active', true)
            ->when($request->filled('q'), fn ($q) => $q->where(function ($query) use ($request) {
                $term = $request->string('q');
                $query->where('name', 'ilike', "%{$term}%")
                    ->orWhere('abbreviation', 'ilike', "%{$term}%");
            }))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'abbreviation']);

        return response()->json($results);
    }

    public function faculties(Institution $institution): JsonResponse
    {
        return response()->json(
            $institution->faculties()->orderBy('name')->get(['id', 'institution_id', 'name', 'abbreviation'])
        );
    }

    public function departments(Faculty $faculty): JsonResponse
    {
        return response()->json(
            $faculty->departments()->orderBy('name')->get(['id', 'faculty_id', 'name', 'abbreviation'])
        );
    }

    public function courseSuggestions(CourseSuggestionsRequest $request, CourseSuggestionService $service): JsonResponse
    {
        $validated = $request->validated();

        $courses = $service->getCoursesForStudent(
            $validated['institution_id'],
            $validated['department_id'],
            $validated['level'],
            $this->onboardingService->currentSemester(),
        );

        return response()->json($courses->map(fn ($c) => [
            'id' => $c->id,
            'course_code' => $c->course_code,
            'course_title' => $c->course_title,
            'credit_units' => $c->credit_units,
            'semester' => $c->semester?->value,
            'is_elective' => $c->is_elective,
        ])->values());
    }

    public function searchCourses(SearchCoursesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $courses = InstitutionCourse::query()
            ->where('institution_id', $validated['institution_id'])
            ->search($validated['q'])
            ->orderBy('course_code')
            ->limit(20)
            ->get(['id', 'course_code', 'course_title', 'credit_units', 'semester', 'is_elective']);

        return response()->json($courses);
    }

    public function countries(): JsonResponse
    {
        $countries = Country::query()
            ->whereHas('educationSystems', fn ($q) => $q->whereHas('curriculumTiers', fn ($t) => $t->where('is_tertiary', false)))
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json($countries);
    }

    public function educationSystems(Country $country): JsonResponse
    {
        $systems = EducationSystem::query()
            ->where('country_id', $country->id)
            ->whereHas('curriculumTiers', fn ($q) => $q->where('is_tertiary', false))
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'system_type']);

        return response()->json($systems);
    }

    public function curriculumTiers(EducationSystem $educationSystem): JsonResponse
    {
        $tiers = CurriculumTier::query()
            ->where('education_system_id', $educationSystem->id)
            ->where('is_tertiary', false)
            ->with(['educationLevels' => fn ($q) => $q->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'sort_order']);

        return response()->json($tiers);
    }

    public function streams(EducationSystem $educationSystem, Request $request): JsonResponse
    {
        $streams = Stream::query()
            ->where('education_system_id', $educationSystem->id)
            ->when($request->filled('tier_id'), fn ($q) => $q->where('applies_from_tier_id', $request->input('tier_id')))
            ->orderBy('name')
            ->get(['id', 'name', 'applies_from_tier_id']);

        return response()->json($streams);
    }

    public function levelSubjects(EducationLevel $educationLevel, Request $request): JsonResponse
    {
        $subjects = LevelSubject::query()
            ->where('education_level_id', $educationLevel->id)
            ->when($request->filled('stream_id'), fn ($q) => $q->where(function ($query) use ($request) {
                $query->whereNull('stream_id')
                    ->orWhere('stream_id', $request->input('stream_id'));
            }))
            ->with('curriculumSubject:id,name')
            ->get(['id', 'education_level_id', 'curriculum_subject_id', 'is_compulsory', 'stream_id']);

        return response()->json($subjects);
    }

    public function assessmentTypes(EducationSystem $educationSystem): JsonResponse
    {
        $types = AssessmentType::query()
            ->where('education_system_id', $educationSystem->id)
            ->where(fn ($q) => $q->where('is_exit_exam', true)->orWhere('is_entrance_exam', true))
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'is_exit_exam', 'is_entrance_exam']);

        return response()->json($types);
    }

    public function institutionTypeLevels(Institution $institution): JsonResponse
    {
        $institutionType = $institution->institutionTypeModel;

        return response()->json([
            'level_progression' => $institutionType?->level_progression ?? [],
        ]);
    }
}
