<?php

namespace App\Http\Controllers\Student;

use App\Enums\AcademicStatus;
use App\Enums\Semester;
use App\Enums\StudentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\CompleteOnboardingRequest;
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
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Services\CourseSuggestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
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
            'semester' => $this->currentSemester(),
            'academic_year' => $this->currentAcademicYear(),
            'countries' => $countries,
        ]);
    }

    public function store(CompleteOnboardingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($validated['student_type'] === 'tertiary') {
            $this->storeTertiary($request, $validated);
        } else {
            $this->storeSecondary($request, $validated);
        }

        return redirect()->route('dashboard');
    }

    /** @param array<string, mixed> $validated */
    private function storeTertiary(CompleteOnboardingRequest $request, array $validated): void
    {
        DB::transaction(function () use ($request, $validated) {
            $profile = StudentProfile::create([
                'user_id' => $request->user()->id,
                'student_type' => StudentType::Tertiary,
                'institution_id' => $validated['institution_id'],
                'faculty_id' => $validated['faculty_id'],
                'department_id' => $validated['department_id'],
                'level' => $validated['level'],
                'matric_number' => $validated['matric_number'] ?? null,
                'admission_year' => $validated['admission_year'] ?? null,
                'study_preferences' => ['daily_goal_minutes' => 30],
                'academic_status' => AcademicStatus::Active,
                'invite_code' => $this->generateInviteCode(),
            ]);

            $semester = $this->currentSemester();
            $academicYear = $this->currentAcademicYear();

            foreach ($validated['course_ids'] as $courseId) {
                StudentCourse::create([
                    'student_profile_id' => $profile->id,
                    'institution_course_id' => $courseId,
                    'semester' => $semester,
                    'academic_year' => $academicYear,
                ]);
            }
        });
    }

    /** @param array<string, mixed> $validated */
    private function storeSecondary(CompleteOnboardingRequest $request, array $validated): void
    {
        StudentProfile::create([
            'user_id' => $request->user()->id,
            'student_type' => StudentType::Secondary,
            'education_system_id' => $validated['education_system_id'],
            'education_level_id' => $validated['education_level_id'],
            'stream_id' => $validated['stream_id'] ?? null,
            'school_name' => $validated['school_name'] ?? null,
            'state_or_region' => $validated['state_or_region'] ?? null,
            'exam_goals' => $validated['exam_goals'] ?? null,
            'study_preferences' => ['daily_goal_minutes' => 30],
            'academic_status' => AcademicStatus::Active,
            'invite_code' => $this->generateInviteCode(),
        ]);
    }

    private function generateInviteCode(): string
    {
        do {
            $code = strtoupper(substr(str_replace(['0', 'O', 'I', 'L'], '', bin2hex(random_bytes(4))), 0, 6));
        } while (StudentProfile::where('invite_code', $code)->exists());

        return $code;
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

    public function courseSuggestions(Request $request, CourseSuggestionService $service): JsonResponse
    {
        $request->validate([
            'institution_id' => ['required', 'string', 'exists:institutions,id'],
            'department_id' => ['required', 'string', 'exists:departments,id'],
            'level' => ['required', 'string'],
        ]);

        $courses = $service->getCoursesForStudent(
            $request->input('institution_id'),
            $request->input('department_id'),
            $request->input('level'),
            $this->currentSemester(),
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

    public function searchCourses(Request $request): JsonResponse
    {
        $request->validate([
            'institution_id' => ['required', 'string', 'exists:institutions,id'],
            'q' => ['required', 'string', 'min:2'],
        ]);

        $courses = InstitutionCourse::query()
            ->where('institution_id', $request->input('institution_id'))
            ->search($request->input('q'))
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

    private function currentSemester(): string
    {
        $month = (int) now()->format('n');

        return $month >= 9 ? Semester::First->value : Semester::Second->value;
    }

    private function currentAcademicYear(): string
    {
        $month = (int) now()->format('n');
        $year = (int) now()->format('Y');

        if ($month >= 9) {
            return $year.'/'.($year + 1);
        }

        return ($year - 1).'/'.$year;
    }
}
