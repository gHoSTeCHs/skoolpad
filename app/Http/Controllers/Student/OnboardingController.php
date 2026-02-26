<?php

namespace App\Http\Controllers\Student;

use App\Enums\AcademicStatus;
use App\Enums\Semester;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\CompleteOnboardingRequest;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
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

        return Inertia::render('onboarding/index', [
            'semester' => $this->currentSemester(),
            'academic_year' => $this->currentAcademicYear(),
        ]);
    }

    public function store(CompleteOnboardingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated) {
            $profile = StudentProfile::create([
                'user_id' => $request->user()->id,
                'institution_id' => $validated['institution_id'],
                'faculty_id' => $validated['faculty_id'],
                'department_id' => $validated['department_id'],
                'level' => $validated['level'],
                'matric_number' => $validated['matric_number'] ?? null,
                'admission_year' => $validated['admission_year'] ?? null,
                'academic_status' => AcademicStatus::Active,
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

    public function courseSuggestions(Request $request, CourseSuggestionService $service): JsonResponse
    {
        $request->validate([
            'institution_id' => ['required', 'string', 'exists:institutions,id'],
            'department_id' => ['required', 'string', 'exists:departments,id'],
            'level' => ['required', 'integer'],
        ]);

        $courses = $service->getCoursesForStudent(
            $request->input('institution_id'),
            $request->input('department_id'),
            (int) $request->input('level'),
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
