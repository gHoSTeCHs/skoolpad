<?php

namespace App\Http\Controllers\Student;

use App\Enums\AnswerDepthLevel;
use App\Enums\PracticeMode;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionType;
use App\Enums\SpacedRepetitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StartPracticeRequest;
use App\Http\Requests\Student\SubmitAnswerRequest;
use App\Models\LevelSubject;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\SpacedRepetitionItem;
use App\Services\PracticeService;
use App\Services\StudyPlannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PracticeController extends Controller
{
    public function __construct(private PracticeService $practiceService) {}

    public function configure(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $enrolledCourses = $profile->studentCourses()
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
            ]);

        $enrolledSubjects = [];
        $isSecondary = $profile?->isSecondary() ?? false;
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

        $modes = collect([
            PracticeMode::Untimed,
            PracticeMode::Timed,
            PracticeMode::SpeedDrill,
            PracticeMode::YearWalk,
            PracticeMode::RandomMix,
        ])->map(fn ($m) => ['value' => $m->value, 'label' => $m->label()]);

        $difficulties = collect(QuestionDifficulty::cases())
            ->map(fn ($d) => ['value' => $d->value, 'label' => $d->label()])
            ->prepend(['value' => 'all', 'label' => 'All Difficulties']);

        $questionTypes = collect(QuestionType::cases())
            ->filter(fn ($t) => $t !== QuestionType::Group)
            ->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()]);

        $assessmentTypes = [];
        if ($profile?->isSecondary()) {
            $assessmentTypes = $user->examGoals()
                ->where('is_active', true)
                ->with('assessmentType:id,name,slug')
                ->get()
                ->map(fn ($g) => [
                    'id' => $g->assessmentType->id,
                    'name' => $g->assessmentType->name,
                ])
                ->unique('id')
                ->values();
        }

        return Inertia::render('practice/configure', [
            'enrolledCourses' => $enrolledCourses,
            'enrolledSubjects' => $enrolledSubjects,
            'isSecondary' => $isSecondary,
            'modes' => $modes,
            'difficulties' => $difficulties,
            'questionTypes' => $questionTypes,
            'assessmentTypes' => $assessmentTypes,
        ]);
    }

    public function start(StartPracticeRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;
        $validated = $request->validated();

        if ($profile?->isSecondary() && ! empty($validated['level_subject_id'])) {
            return $this->startSecondary($user, $profile, $validated);
        }

        $enrolledCourseIds = $profile->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        if (! empty($validated['question_id'])) {
            $question = Question::findOrFail($validated['question_id']);

            if (! $enrolledCourseIds->contains($question->institution_course_id)) {
                abort(403, 'You are not enrolled in this course.');
            }

            $config = [
                'institution_course_id' => $question->institution_course_id,
                'question_id' => $validated['question_id'],
                'question_count' => 1,
                'mode' => $validated['mode'] ?? PracticeMode::Untimed->value,
                'topic_ids' => [],
                'question_types' => [],
                'difficulty' => 'all',
                'time_limit_seconds' => null,
                'assessment_type_id' => $validated['assessment_type_id'] ?? null,
                'exclude_user_id' => $user->id,
            ];
        } else {
            if (! $enrolledCourseIds->contains($validated['institution_course_id'])) {
                abort(403, 'You are not enrolled in this course.');
            }

            $config = [
                'institution_course_id' => $validated['institution_course_id'],
                'topic_ids' => $validated['topic_ids'],
                'question_types' => $validated['question_types'] ?? [],
                'difficulty' => $validated['difficulty'] ?? 'all',
                'question_count' => $validated['question_count'],
                'mode' => $validated['mode'],
                'time_limit_seconds' => $validated['time_limit_seconds'] ?? null,
                'assessment_type_id' => $validated['assessment_type_id'] ?? null,
                'exclude_user_id' => $user->id,
            ];
        }

        $session = $this->practiceService->createSession($user, $config);

        return redirect()->route('practice.show', $session);
    }

    private function startSecondary(\App\Models\User $user, \App\Models\StudentProfile $profile, array $validated): RedirectResponse
    {
        $levelSubject = LevelSubject::findOrFail($validated['level_subject_id']);

        if ($levelSubject->education_level_id !== $profile->education_level_id) {
            abort(403, 'This subject is not available for your education level.');
        }

        if ($profile->stream_id && $levelSubject->stream_id && $levelSubject->stream_id !== $profile->stream_id) {
            abort(403, 'This subject is not available for your stream.');
        }

        if (! empty($validated['question_id'])) {
            $question = Question::findOrFail($validated['question_id']);

            $config = [
                'level_subject_id' => $levelSubject->id,
                'question_id' => $validated['question_id'],
                'question_count' => 1,
                'mode' => $validated['mode'] ?? PracticeMode::Untimed->value,
                'topic_ids' => $question->topicLinks->pluck('canonical_topic_id')->toArray(),
                'question_types' => [],
                'difficulty' => 'all',
                'time_limit_seconds' => null,
                'assessment_type_id' => $validated['assessment_type_id'] ?? null,
                'exclude_user_id' => $user->id,
            ];
        } else {
            $config = [
                'level_subject_id' => $levelSubject->id,
                'topic_ids' => $validated['topic_ids'],
                'question_types' => $validated['question_types'] ?? [],
                'difficulty' => $validated['difficulty'] ?? 'all',
                'question_count' => $validated['question_count'],
                'mode' => $validated['mode'],
                'time_limit_seconds' => $validated['time_limit_seconds'] ?? null,
                'assessment_type_id' => $validated['assessment_type_id'] ?? null,
                'exclude_user_id' => $user->id,
            ];
        }

        $session = $this->practiceService->createSession($user, $config);

        return redirect()->route('practice.show', $session);
    }

    public function availableCount(Request $request): JsonResponse
    {
        $config = [
            'institution_course_id' => $request->string('institution_course_id')->value() ?: null,
            'topic_ids' => $request->input('topic_ids', []),
            'question_types' => $request->input('question_types', []),
            'difficulty' => $request->string('difficulty', 'all')->value(),
            'assessment_type_id' => $request->string('assessment_type_id')->value() ?: null,
        ];

        $count = $this->practiceService->getAvailableQuestionCount($config);

        return response()->json(['count' => $count]);
    }

    public function show(PracticeSession $session, Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($session->user_id !== $user->id) {
            abort(403);
        }

        if ($session->is_resumable
            && ! $session->completed_at
            && $session->last_activity_at?->diffInHours(now()) >= 24
        ) {
            $session->update(['is_resumable' => false]);
        }

        if (! $session->is_resumable && $session->completed_at) {
            return redirect()->route('practice.results', $session);
        }

        if (! $session->is_resumable && $session->completed_at === null) {
            return redirect()->route('practice.configure')
                ->with('warning', 'That practice session has expired.');
        }

        $questions = $this->practiceService->getSessionQuestions($session);
        $answers = $session->practiceAnswers()->get()->keyBy('question_id');

        $firstUnanswered = $questions->first(fn ($q) => ! $answers->has($q->id));
        $currentIndex = $firstUnanswered
            ? $questions->search(fn ($q) => $q->id === $firstUnanswered->id)
            : $questions->count() - 1;

        return Inertia::render('practice/show', [
            'session' => [
                'id' => $session->id,
                'mode' => $session->mode->value,
                'question_count' => $session->question_count,
                'time_limit_seconds' => $session->time_limit_seconds,
                'is_resumable' => $session->is_resumable,
                'completed_at' => $session->completed_at?->toISOString(),
            ],
            'questions' => $questions->map(fn ($q, $index) => [
                'id' => $q->id,
                'content' => $q->content,
                'question_type' => $q->question_type->value,
                'response_config' => $q->response_config,
                'marks' => $q->marks,
                'difficulty_level' => $q->difficulty_level?->value,
                'sequence_order' => $index,
                'contexts' => $q->contexts->map(fn ($c) => [
                    'id' => $c->id,
                    'context_type' => $c->context_type->value ?? $c->context_type,
                    'title' => $c->title,
                    'content' => $c->content,
                    'media_url' => $c->media_url,
                    'table_data' => $c->table_data,
                    'word_bank' => $c->word_bank,
                ]),
                'children' => $q->children->map(fn ($child) => [
                    'id' => $child->id,
                    'content' => $child->content,
                    'question_type' => $child->question_type->value,
                    'response_config' => $child->response_config,
                    'marks' => $child->marks,
                    'contexts' => $child->contexts->map(fn ($c) => [
                        'id' => $c->id,
                        'context_type' => $c->context_type->value ?? $c->context_type,
                        'media_url' => $c->media_url,
                    ]),
                ]),
                'quick_answer' => $answers->has($q->id)
                    ? $q->answers->first()?->only(['content', 'content_plain'])
                    : null,
                'topic_links' => $q->topicLinks->map(fn ($tl) => [
                    'canonical_topic' => [
                        'id' => $tl->canonicalTopic->id,
                        'title' => $tl->canonicalTopic->title,
                    ],
                ]),
            ]),
            'answers' => $answers->mapWithKeys(fn ($a) => [$a->question_id => [
                'id' => $a->id,
                'question_id' => $a->question_id,
                'selected_option_label' => $a->selected_option_label,
                'response_data' => $a->response_data,
                'is_correct' => $a->is_correct,
                'time_spent_seconds' => $a->time_spent_seconds,
                'was_skipped' => $a->was_skipped,
                'sequence_order' => $a->sequence_order,
            ]]),
            'currentIndex' => $currentIndex,
        ]);
    }

    public function answer(PracticeSession $session, SubmitAnswerRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($session->user_id !== $user->id) {
            abort(403);
        }

        if ($session->completed_at) {
            abort(422, 'Session is already completed.');
        }

        if (! $session->is_resumable) {
            abort(422, 'Session has expired.');
        }

        $validated = $request->validated();

        $questionId = $validated['question_id'];

        if (! in_array($questionId, $session->question_ids ?? [])) {
            abort(422, 'Question is not part of this session.');
        }

        $existingAnswer = $session->practiceAnswers()->where('question_id', $questionId)->first();
        if ($existingAnswer) {
            abort(422, 'Question has already been answered.');
        }

        $question = Question::with('children')->findOrFail($questionId);

        $answerData = array_merge($validated, [
            'selected_label' => $validated['selected_label'] ?? ($validated['response_data']['selected_label'] ?? null),
            'text' => $validated['text'] ?? ($validated['response_data']['text'] ?? null),
        ]);

        $practiceAnswer = $this->practiceService->submitAnswer($session, $question, $answerData);

        $correctAnswer = null;
        if ($this->practiceService->isAutoGradable($question->question_type)) {
            $correctAnswer = $this->getCorrectAnswerData($question);
        }

        $quickAnswer = $question->answers()
            ->where('depth_level', AnswerDepthLevel::Quick)
            ->where('is_published', true)
            ->first();

        return response()->json([
            'is_correct' => $practiceAnswer->is_correct,
            'correct_answer' => $correctAnswer,
            'quick_answer_content' => $quickAnswer?->content,
        ]);
    }

    public function complete(PracticeSession $session, Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($session->user_id !== $user->id) {
            abort(403);
        }

        if ($session->completed_at) {
            return redirect()->route('practice.results', $session);
        }

        $this->practiceService->completeSession($session);

        return redirect()->route('practice.results', $session);
    }

    public function results(PracticeSession $session, Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($session->user_id !== $user->id) {
            abort(403);
        }

        if (! $session->completed_at) {
            return redirect()->route('practice.show', $session);
        }

        $session->load(['institutionCourse:id,course_code,course_title', 'levelSubject.curriculumSubject:id,name']);

        $answers = $session->practiceAnswers()
            ->with([
                'question:id,content,question_type,response_config,marks,difficulty_level,parent_question_id,question_section_id',
                'question.children:id,content,question_type,response_config,marks,parent_question_id,sort_order',
                'question.topicLinks.canonicalTopic:id,title',
                'question.answers' => fn ($q) => $q->where('depth_level', AnswerDepthLevel::Quick)->where('is_published', true),
            ])
            ->orderBy('sequence_order')
            ->get();

        $perQuestion = $answers->map(fn ($a) => [
            'question_id' => $a->question_id,
            'question_content' => $a->question->content,
            'question_type' => $a->question->question_type->value,
            'is_correct' => $a->is_correct,
            'was_skipped' => $a->was_skipped,
            'student_answer' => $a->response_data,
            'correct_answer' => $this->getCorrectAnswerData($a->question),
            'time_spent_seconds' => $a->time_spent_seconds,
            'quick_answer' => $a->question->answers->first()?->content,
        ]);

        $perTopic = $answers
            ->flatMap(fn ($a) => $a->question->topicLinks->map(fn ($tl) => [
                'topic_id' => $tl->canonical_topic_id,
                'topic_title' => $tl->canonicalTopic->title,
                'is_correct' => $a->is_correct,
            ]))
            ->whereNotNull('is_correct')
            ->groupBy('topic_id')
            ->map(fn ($group) => [
                'topic_id' => $group->first()['topic_id'],
                'topic_title' => $group->first()['topic_title'],
                'correct' => $group->where('is_correct', true)->count(),
                'total' => $group->count(),
                'accuracy' => round($group->where('is_correct', true)->count() / $group->count() * 100),
            ])
            ->values();

        $reviewMetrics = null;
        if ($session->mode === PracticeMode::Review) {
            $questionIds = $session->question_ids ?? [];
            $items = SpacedRepetitionItem::query()
                ->where('user_id', $user->id)
                ->whereIn('question_id', $questionIds)
                ->get();

            $reviewMetrics = [
                'progressed' => $items->filter(fn ($i) => $i->interval_days > 1 && $i->status === SpacedRepetitionStatus::Active)->count(),
                'reset' => $items->filter(fn ($i) => $i->interval_days <= 1 && $i->status === SpacedRepetitionStatus::Active)->count(),
                'graduated' => $items->filter(fn ($i) => $i->status === SpacedRepetitionStatus::Graduated)->count(),
            ];
        }

        $predictiveScore = null;
        if ($session->assessment_type_id) {
            $predictiveScore = app(StudyPlannerService::class)->getPredictiveScore($session);
        }

        $sectionBreakdown = null;
        if ($session->question_paper_id) {
            $paper = $session->questionPaper()->with('sections')->first();
            if ($paper) {
                $sectionBreakdown = $paper->sections->sortBy('sort_order')->map(function ($section) use ($answers) {
                    $sectionAnswers = $answers->filter(fn ($a) => $a->question->question_section_id === $section->id);

                    return [
                        'section_label' => $section->label,
                        'correct' => $sectionAnswers->where('is_correct', true)->count(),
                        'total' => $sectionAnswers->count(),
                        'marks_earned' => $sectionAnswers->where('is_correct', true)->sum(fn ($a) => $a->question->marks ?? 0),
                        'marks_possible' => $section->marks,
                    ];
                })->values();
            }
        }

        return Inertia::render('practice/results', [
            'session' => [
                'id' => $session->id,
                'mode' => $session->mode->value,
                'question_count' => $session->question_count,
                'correct_count' => $session->correct_count,
                'total_time_seconds' => $session->total_time_seconds,
                'time_limit_seconds' => $session->time_limit_seconds,
                'score_percentage' => $session->score_percentage,
                'completed_at' => $session->completed_at->toISOString(),
                'institution_course' => $session->institutionCourse ? [
                    'id' => $session->institutionCourse->id,
                    'course_code' => $session->institutionCourse->course_code,
                    'course_title' => $session->institutionCourse->course_title,
                ] : null,
                'level_subject' => $session->levelSubject ? [
                    'id' => $session->levelSubject->id,
                    'subject_name' => $session->levelSubject->curriculumSubject->name,
                ] : null,
            ],
            'perQuestion' => $perQuestion,
            'perTopic' => $perTopic,
            'reviewMetrics' => $reviewMetrics,
            'predictiveScore' => $predictiveScore,
            'sectionBreakdown' => $sectionBreakdown,
            'hasActiveExams' => $user->examTimetableEntries()->active()->exists(),
        ]);
    }

    private function getCorrectAnswerData(Question $question): ?array
    {
        return match ($question->question_type) {
            QuestionType::Mcq => [
                'correct_label' => collect($question->response_config['options'] ?? [])
                    ->firstWhere('is_correct', true)['label'] ?? null,
            ],
            QuestionType::MultiSelectMcq => [
                'correct_labels' => collect($question->response_config['options'] ?? [])
                    ->where('is_correct', true)->pluck('label')->values()->toArray(),
            ],
            QuestionType::TrueFalse => [
                'correct_answer' => $question->response_config['correct_answer'] ?? null,
            ],
            QuestionType::NumericEntry => [
                'answer' => $question->response_config['answer'] ?? null,
                'tolerance' => $question->response_config['tolerance'] ?? 0,
                'unit' => $question->response_config['unit'] ?? null,
            ],
            QuestionType::AssertionReason => [
                'correct_label' => collect($question->response_config['options'] ?? [])
                    ->firstWhere('is_correct', true)['label'] ?? null,
            ],
            QuestionType::Matching => [
                'pairs' => $question->response_config['pairs'] ?? [],
            ],
            QuestionType::Ordering => [
                'correct_order' => $question->response_config['correct_order'] ?? [],
                'items' => $question->response_config['items'] ?? [],
            ],
            QuestionType::Cloze => [
                'gaps' => $question->response_config['gaps'] ?? [],
            ],
            QuestionType::FillBlank => [
                'blanks' => $question->response_config['blanks'] ?? [],
            ],
            QuestionType::DiagramLabel => [
                'labels' => $question->response_config['labels'] ?? [],
            ],
            QuestionType::MatrixMatching => [
                'mapping' => $question->response_config['mapping'] ?? [],
                'left' => $question->response_config['left'] ?? [],
                'right' => $question->response_config['right'] ?? [],
            ],
            QuestionType::Group => [
                'children' => $question->children->mapWithKeys(fn ($child) => [
                    $child->id => $this->getCorrectAnswerData($child),
                ])->toArray(),
            ],
            default => null,
        };
    }
}
