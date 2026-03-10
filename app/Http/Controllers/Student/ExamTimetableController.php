<?php

namespace App\Http\Controllers\Student;

use App\Enums\PracticeMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StartMockRequest;
use App\Http\Requests\Student\StartStudyingRequest;
use App\Http\Requests\Student\StoreExamTimetableRequest;
use App\Http\Requests\Student\UpdateExamTimetableRequest;
use App\Models\ExamGoal;
use App\Models\ExamTimetableEntry;
use App\Models\LevelSubject;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\PracticeService;
use App\Services\StudyPlannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamTimetableController extends Controller
{
    public function __construct(
        private readonly StudyPlannerService $studyPlannerService,
        private readonly PracticeService $practiceService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        if ($profile && ! ($profile->study_preferences['exam_goals_migrated'] ?? false)) {
            $this->migrateExamGoals($user, $profile);
        }

        $isSecondary = $profile?->isSecondary() ?? false;

        $entries = $user->examTimetableEntries()
            ->with([
                'institutionCourse:id,course_code,course_title',
                'levelSubject.curriculumSubject:id,name',
                'assessmentType:id,name',
                'aocTopics:id,title',
            ])
            ->orderedByDate()
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'label' => $e->label,
                'exam_date' => $e->exam_date->toISOString(),
                'exam_time' => $e->exam_time,
                'notes' => $e->notes,
                'is_completed' => $e->is_completed,
                'completed_at' => $e->completed_at?->toISOString(),
                'is_past' => $e->is_past,
                'days_remaining' => $e->days_remaining,
                'is_imminent' => $e->is_imminent,
                'is_upcoming' => $e->is_upcoming,
                'subject_name' => $e->subject_name,
                'has_aoc' => $e->has_aoc,
                'institution_course' => $e->institutionCourse ? [
                    'id' => $e->institutionCourse->id,
                    'course_code' => $e->institutionCourse->course_code,
                    'course_title' => $e->institutionCourse->course_title,
                ] : null,
                'level_subject' => $e->levelSubject ? [
                    'id' => $e->levelSubject->id,
                    'subject_name' => $e->levelSubject->curriculumSubject->name,
                ] : null,
                'assessment_type' => $e->assessmentType ? [
                    'id' => $e->assessmentType->id,
                    'name' => $e->assessmentType->name,
                ] : null,
                'aoc_topics' => $e->aocTopics->map(fn ($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                ]),
            ]);

        $enrolledCourses = $profile
            ? $profile->studentCourses()
                ->where('is_archived', false)
                ->with([
                    'institutionCourse:id,course_code,course_title',
                    'institutionCourse.topics:id,title',
                ])
                ->get()
                ->map(fn ($sc) => [
                    'id' => $sc->institutionCourse->id,
                    'course_code' => $sc->institutionCourse->course_code,
                    'course_title' => $sc->institutionCourse->course_title,
                    'topics' => $sc->institutionCourse->topics->map(fn ($t) => [
                        'id' => $t->id,
                        'title' => $t->title,
                    ]),
                ])
            : collect();

        $enrolledSubjects = [];
        if ($isSecondary) {
            $enrolledSubjects = LevelSubject::query()
                ->where('education_level_id', $profile->education_level_id)
                ->when($profile->stream_id, fn ($q) => $q->where(function ($q2) use ($profile) {
                    $q2->where('stream_id', $profile->stream_id)->orWhereNull('stream_id');
                }))
                ->with([
                    'curriculumSubject:id,name',
                    'schemeOfWorkItems' => fn ($q) => $q->whereNotNull('canonical_topic_id'),
                    'schemeOfWorkItems.canonicalTopic:id,title',
                ])
                ->get()
                ->map(fn ($ls) => [
                    'id' => $ls->id,
                    'subject_name' => $ls->curriculumSubject->name,
                    'topics' => $ls->schemeOfWorkItems
                        ->whereNotNull('canonical_topic_id')
                        ->map(fn ($sow) => ['id' => $sow->canonicalTopic->id, 'title' => $sow->canonicalTopic->title])
                        ->unique('id')->values(),
                ]);
        }

        $assessmentTypes = [];
        if ($isSecondary) {
            $assessmentTypes = $user->examGoals()
                ->where('is_active', true)
                ->with('assessmentType:id,name')
                ->get()
                ->map(fn ($g) => [
                    'id' => $g->assessmentType->id,
                    'name' => $g->assessmentType->name,
                ])
                ->unique('id')
                ->values();
        }

        $hasActiveEntries = $user->examTimetableEntries()->active()->exists();

        $topicReadiness = [];
        $mockPapers = [];

        foreach ($user->examTimetableEntries()->active()->with(['aocTopics'])->get() as $activeEntry) {
            $topicReadiness[$activeEntry->id] = $this->studyPlannerService->getTopicReadiness($user, $activeEntry);

            if ($activeEntry->assessment_type_id) {
                $papers = $this->studyPlannerService->getAvailablePapers($activeEntry);
                $mockPapers[$activeEntry->id] = $papers->map(fn ($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'year' => $p->year,
                    'duration_minutes' => $p->duration_minutes,
                    'total_marks' => $p->total_marks,
                    'question_count' => $p->questions_count,
                ])->values()->all();
            }
        }

        return Inertia::render('exam-timetable/index', [
            'entries' => $entries,
            'enrolledCourses' => $enrolledCourses,
            'enrolledSubjects' => $enrolledSubjects,
            'assessmentTypes' => $assessmentTypes,
            'isSecondary' => $isSecondary,
            'topicReadiness' => $topicReadiness,
            'mockPapers' => $mockPapers,
            'dailyPlan' => $hasActiveEntries && $profile
                ? $this->studyPlannerService->buildDailyPlan($user, $profile)
                : null,
            'examSummary' => $hasActiveEntries && $profile
                ? $this->studyPlannerService->getExamSummary($user, $profile)
                : null,
        ]);
    }

    public function store(StoreExamTimetableRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;
        $validated = $request->validated();

        $this->validateOwnership($profile, $validated);
        $this->validateAocTopics($validated);

        $duplicate = $user->examTimetableEntries()
            ->where('institution_course_id', $validated['institution_course_id'] ?? null)
            ->where('level_subject_id', $validated['level_subject_id'] ?? null)
            ->where('exam_date', $validated['exam_date'])
            ->exists();

        if ($duplicate) {
            return redirect()->back()->withErrors(['exam_date' => 'An exam entry already exists for this course/subject on this date.']);
        }

        $entry = $user->examTimetableEntries()->create(collect($validated)->except('aoc_topic_ids')->toArray());

        if (! empty($validated['aoc_topic_ids'])) {
            $entry->aocTopics()->sync($validated['aoc_topic_ids']);
        }

        return redirect()->back()->with('success', 'Exam entry added.');
    }

    public function update(UpdateExamTimetableRequest $request, ExamTimetableEntry $entry): RedirectResponse
    {
        if ($entry->user_id !== $request->user()->id) {
            abort(403);
        }

        $profile = $request->user()->studentProfile;
        $validated = $request->validated();

        $this->validateOwnership($profile, $validated);
        $this->validateAocTopics($validated);

        $entry->update(collect($validated)->except('aoc_topic_ids')->toArray());
        $entry->aocTopics()->sync($validated['aoc_topic_ids'] ?? []);

        return redirect()->back()->with('success', 'Exam entry updated.');
    }

    public function complete(ExamTimetableEntry $entry, Request $request): RedirectResponse
    {
        if ($entry->user_id !== $request->user()->id) {
            abort(403);
        }

        $entry->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Exam marked as completed.');
    }

    public function destroy(ExamTimetableEntry $entry, Request $request): RedirectResponse
    {
        if ($entry->user_id !== $request->user()->id) {
            abort(403);
        }

        $entry->delete();

        return redirect()->back()->with('success', 'Exam entry deleted.');
    }

    public function startMock(StartMockRequest $request, ExamTimetableEntry $entry): RedirectResponse
    {
        if ($entry->user_id !== $request->user()->id) {
            abort(403);
        }

        $paper = \App\Models\QuestionPaper::query()->findOrFail($request->validated('question_paper_id'));

        if (! $paper->is_published) {
            abort(403, 'This paper is not available.');
        }

        if ($entry->assessment_type_id && $paper->assessment_type_id !== $entry->assessment_type_id) {
            abort(403, 'This paper does not match the exam assessment type.');
        }

        $session = $this->studyPlannerService->createMockSession($request->user(), $entry, $paper);

        return redirect()->route('practice.show', $session);
    }

    public function startStudying(StartStudyingRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        if (! $profile) {
            return redirect()->back()->with('error', 'Complete your profile setup first.');
        }

        $entryId = $request->validated('entry_id');
        if ($entryId) {
            $entry = ExamTimetableEntry::query()->find($entryId);
            if (! $entry || $entry->user_id !== $user->id) {
                abort(403);
            }
        }

        $dailyPlan = $this->studyPlannerService->buildDailyPlan($user, $profile);

        if (! $dailyPlan || empty($dailyPlan['items'])) {
            return redirect()->back()->with('error', 'No study plan available — add exams to your timetable first.');
        }

        $items = collect($dailyPlan['items']);

        if ($entryId) {
            $items = $items->filter(fn ($item) => $item['entry_id'] === $entryId);
        }

        $actionableItem = $items->first(fn ($item) => $item['action'] !== 'review');

        if (! $actionableItem) {
            $actionableItem = $items->first();
        }

        if (! $actionableItem) {
            return redirect()->back()->with('error', 'No actionable study items found.');
        }

        if ($actionableItem['action'] === 'read' && $actionableItem['topic_id']) {
            return redirect()->route('topics.read', $actionableItem['topic_id']);
        }

        if ($actionableItem['action'] === 'review') {
            return redirect()->route('review-queue.index');
        }

        $entry = $entryId
            ? ExamTimetableEntry::query()->find($entryId)
            : ($actionableItem['entry_id']
                ? ExamTimetableEntry::query()->find($actionableItem['entry_id'])
                : null);

        $topicIds = $items
            ->filter(fn ($item) => $item['topic_id'] && $item['action'] === 'practice')
            ->pluck('topic_id')
            ->unique()
            ->values()
            ->toArray();

        if (empty($topicIds) && $actionableItem['topic_id']) {
            $topicIds = [$actionableItem['topic_id']];
        }

        $mode = $entry?->assessment_type_id
            ? PracticeMode::Timed->value
            : PracticeMode::Untimed->value;

        $session = $this->practiceService->createSession($user, [
            'institution_course_id' => $entry?->institution_course_id,
            'level_subject_id' => $entry?->level_subject_id,
            'topic_ids' => $topicIds,
            'question_count' => $actionableItem['suggested_question_count'] ?? 10,
            'mode' => $mode,
            'exclude_user_id' => $user->id,
        ]);

        return redirect()->route('practice.show', $session);
    }

    public function calendarData(Request $request): JsonResponse
    {
        $entries = $request->user()->examTimetableEntries()
            ->with([
                'institutionCourse:id,course_code,course_title',
                'levelSubject.curriculumSubject:id,name',
            ])
            ->orderedByDate()
            ->get()
            ->groupBy(fn ($e) => $e->exam_date->format('Y-m-d'))
            ->map(fn ($group) => $group->map(fn ($e) => [
                'id' => $e->id,
                'label' => $e->label,
                'is_completed' => $e->is_completed,
                'is_past' => $e->is_past,
                'days_remaining' => $e->days_remaining,
                'is_imminent' => $e->is_imminent,
                'is_upcoming' => $e->is_upcoming,
                'subject_name' => $e->subject_name,
            ]));

        return response()->json(['entries' => $entries]);
    }

    private function validateOwnership(StudentProfile $profile, array $validated): void
    {
        if (! empty($validated['institution_course_id'])) {
            $enrolledCourseIds = $profile->studentCourses()
                ->where('is_archived', false)
                ->pluck('institution_course_id');

            if (! $enrolledCourseIds->contains($validated['institution_course_id'])) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        if (! empty($validated['level_subject_id'])) {
            $levelSubject = LevelSubject::query()->findOrFail($validated['level_subject_id']);

            if ($levelSubject->education_level_id !== $profile->education_level_id) {
                abort(403, 'This subject is not available for your education level.');
            }

            if ($profile->stream_id && $levelSubject->stream_id && $levelSubject->stream_id !== $profile->stream_id) {
                abort(403, 'This subject is not available for your stream.');
            }
        }
    }

    private function validateAocTopics(array $validated): void
    {
        if (empty($validated['aoc_topic_ids'])) {
            return;
        }

        $validTopicIds = collect();

        if (! empty($validated['institution_course_id'])) {
            $validTopicIds = \App\Models\InstitutionCourse::query()->findOrFail($validated['institution_course_id'])
                ->topics()
                ->pluck('canonical_topics.id');
        } elseif (! empty($validated['level_subject_id'])) {
            $validTopicIds = \App\Models\SchemeOfWorkItem::query()
                ->where('curriculum_subject_level_id', $validated['level_subject_id'])
                ->whereNotNull('canonical_topic_id')
                ->pluck('canonical_topic_id');
        }

        $invalidTopics = collect($validated['aoc_topic_ids'])->diff($validTopicIds);
        if ($invalidTopics->isNotEmpty()) {
            abort(422, 'Some AOC topics do not belong to the selected course or subject.');
        }
    }

    private function migrateExamGoals(User $user, StudentProfile $profile): void
    {
        $goals = ExamGoal::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereNotNull('exam_date')
            ->whereNotNull('institution_course_id')
            ->with(['assessmentType:id,name', 'institutionCourse:id,course_title'])
            ->get();

        foreach ($goals as $goal) {
            $exists = $user->examTimetableEntries()
                ->where('institution_course_id', $goal->institution_course_id)
                ->where('exam_date', $goal->exam_date)
                ->exists();

            if ($exists) {
                continue;
            }

            $label = ($goal->institutionCourse?->course_title ?? 'Exam')
                .($goal->assessmentType ? ' — '.$goal->assessmentType->name : '');

            $user->examTimetableEntries()->create([
                'institution_course_id' => $goal->institution_course_id,
                'assessment_type_id' => $goal->assessment_type_id,
                'label' => $label,
                'exam_date' => $goal->exam_date,
            ]);
        }

        $profile->update([
            'study_preferences' => array_merge(
                $profile->study_preferences ?? [],
                ['exam_goals_migrated' => true]
            ),
        ]);
    }
}
