<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreNoteRequest;
use App\Http\Requests\Student\UpdateNoteRequest;
use App\Models\CanonicalTopic;
use App\Models\InstitutionCourse;
use App\Models\StudentNote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    use Paginates;

    private const SORTABLE = ['title', 'updated_at', 'created_at'];

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;
        $isSecondary = $profile?->isSecondary() ?? false;

        if ($isSecondary) {
            return Inertia::render('notes/index', [
                'isSecondary' => true,
                'notes' => $this->paginated(
                    StudentNote::query()->whereRaw('1=0')->paginate(self::DEFAULT_PER_PAGE)
                ),
                'filters' => ['search' => '', 'sort' => '', 'direction' => '', 'course_id' => ''],
                'enrolledCourses' => [],
            ]);
        }

        $query = StudentNote::query()
            ->where('user_id', $user->id)
            ->with([
                'canonicalTopic:id,title',
                'institutionCourse:id,course_code,course_title',
            ])
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('course_id'), fn ($q) => $q->where('institution_course_id', $request->string('course_id')));

        $query->orderByDesc('is_pinned');
        $query = $this->applySorting($query, $request, self::SORTABLE, 'updated_at', 'desc');

        $paginator = $query->paginate(self::DEFAULT_PER_PAGE);

        $paginator->getCollection()->transform(fn (StudentNote $note) => [
            'id' => $note->id,
            'title' => $note->title,
            'is_pinned' => $note->is_pinned,
            'updated_at' => $note->updated_at->toISOString(),
            'created_at' => $note->created_at->toISOString(),
            'canonical_topic' => $note->canonicalTopic
                ? ['id' => $note->canonicalTopic->id, 'title' => $note->canonicalTopic->title]
                : null,
            'institution_course' => $note->institutionCourse
                ? [
                    'id' => $note->institutionCourse->id,
                    'course_code' => $note->institutionCourse->course_code,
                    'course_title' => $note->institutionCourse->course_title,
                ]
                : null,
        ]);

        return Inertia::render('notes/index', [
            'notes' => $this->paginated($paginator),
            'filters' => [
                'search' => $request->string('search')->value() ?: '',
                'sort' => $request->string('sort')->value() ?: '',
                'direction' => $request->string('direction')->value() ?: '',
                'course_id' => $request->string('course_id')->value() ?: '',
            ],
            'enrolledCourses' => $this->getEnrolledCourses($profile),
            'isSecondary' => false,
        ]);
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        if ($profile?->isSecondary()) {
            return redirect()->route('notes.index');
        }

        $topicContext = null;
        if ($request->filled('topic_id')) {
            $topic = CanonicalTopic::query()->find($request->string('topic_id'));
            if ($topic) {
                $topicContext = ['id' => $topic->id, 'title' => $topic->title];
            }
        }

        $courseContext = null;
        if ($request->filled('course_id')) {
            $course = InstitutionCourse::query()->find($request->string('course_id'));
            if ($course) {
                $courseContext = [
                    'id' => $course->id,
                    'course_code' => $course->course_code,
                    'course_title' => $course->course_title,
                ];
            }
        }

        return Inertia::render('notes/create', [
            'enrolledCourses' => $this->getEnrolledCourses($profile),
            'topicContext' => $topicContext,
            'courseContext' => $courseContext,
        ]);
    }

    public function store(StoreNoteRequest $request): RedirectResponse
    {
        $profile = $request->user()->studentProfile;

        if ($profile?->isSecondary()) {
            abort(403);
        }

        $note = StudentNote::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('notes.show', $note)
            ->with('success', 'Note created.');
    }

    public function show(StudentNote $note, Request $request): Response
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }

        $note->load(['canonicalTopic:id,title', 'institutionCourse:id,course_code,course_title']);

        $profile = $request->user()->studentProfile;

        return Inertia::render('notes/show', [
            'note' => [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'is_pinned' => $note->is_pinned,
                'canonical_topic' => $note->canonicalTopic
                    ? ['id' => $note->canonicalTopic->id, 'title' => $note->canonicalTopic->title]
                    : null,
                'institution_course' => $note->institutionCourse
                    ? [
                        'id' => $note->institutionCourse->id,
                        'course_code' => $note->institutionCourse->course_code,
                        'course_title' => $note->institutionCourse->course_title,
                    ]
                    : null,
                'updated_at' => $note->updated_at->toISOString(),
            ],
            'enrolledCourses' => $this->getEnrolledCourses($profile),
        ]);
    }

    public function update(UpdateNoteRequest $request, StudentNote $note): RedirectResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }

        $note->update($request->validated());

        return redirect()->back()->with('success', 'Note saved.');
    }

    public function destroy(StudentNote $note, Request $request): RedirectResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }

        $note->delete();

        return redirect()->route('notes.index')
            ->with('success', 'Note deleted.');
    }

    private function getEnrolledCourses(?\App\Models\StudentProfile $profile): \Illuminate\Support\Collection
    {
        if (! $profile) {
            return collect();
        }

        return $profile->studentCourses()
            ->where('is_archived', false)
            ->with('institutionCourse:id,course_code,course_title')
            ->get()
            ->filter(fn ($sc) => $sc->institutionCourse !== null)
            ->map(fn ($sc) => [
                'id' => $sc->institutionCourse->id,
                'course_code' => $sc->institutionCourse->course_code,
                'course_title' => $sc->institutionCourse->course_title,
            ])
            ->values();
    }
}
