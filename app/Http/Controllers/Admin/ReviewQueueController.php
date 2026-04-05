<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectSubmissionRequest;
use App\Http\Requests\Admin\TranscribeUploadRequest;
use App\Models\ContentSubmission;
use App\Models\Institution;
use App\Services\Admin\ContentReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewQueueController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $submissions = ContentSubmission::query()
            ->with([
                'submittedBy:id,name,email',
                'institutionCourse:id,course_code,institution_id',
                'institutionCourse.institution:id,abbreviation',
            ])
            ->when(
                $request->filled('submission_type'),
                fn ($q) => $q->where('submission_type', $request->string('submission_type'))
            )
            ->when(
                $request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')),
                fn ($q) => $q->where('status', ContentSubmissionStatus::Pending)
            )
            ->orderBy('created_at', 'asc')
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $submissions->through(fn (ContentSubmission $s) => [
            'id' => $s->id,
            'submission_type' => $s->submission_type->value,
            'submission_type_label' => $s->submission_type->label(),
            'status' => $s->status->value,
            'status_label' => $s->status->label(),
            'submitted_by_name' => $s->submittedBy?->name ?? '—',
            'course_code' => $s->institutionCourse?->course_code,
            'institution_abbreviation' => $s->institutionCourse?->institution?->abbreviation,
            'has_images' => ! empty($s->images),
            'created_at' => $s->created_at,
        ]);

        return Inertia::render('admin/review-queue/index', [
            'submissions' => $this->paginated($submissions),
            'filters' => $request->only(['submission_type', 'status']),
            'submission_types' => ContentSubmissionType::toSelectOptions(),
            'statuses' => ContentSubmissionStatus::toSelectOptions(),
        ]);
    }

    public function show(ContentSubmission $submission): Response
    {
        $submission->load([
            'submittedBy:id,name,email',
            'reviewer:id,name',
            'relatedQuestion:id,content',
            'relatedTopic:id,title',
            'institutionCourse:id,course_code,institution_id',
            'institutionCourse.institution:id,abbreviation',
        ]);

        return Inertia::render('admin/review-queue/show', [
            'submission' => [
                'id' => $submission->id,
                'submission_type' => $submission->submission_type->value,
                'submission_type_label' => $submission->submission_type->label(),
                'status' => $submission->status->value,
                'status_label' => $submission->status->label(),
                'content' => $submission->content,
                'images' => $submission->images,
                'exam_year' => $submission->exam_year,
                'exam_semester' => $submission->exam_semester?->value,
                'reviewer_notes' => $submission->reviewer_notes,
                'reviewed_at' => $submission->reviewed_at?->toISOString(),
                'created_at' => $submission->created_at,
                'submitted_by' => $submission->submittedBy ? [
                    'id' => $submission->submittedBy->id,
                    'name' => $submission->submittedBy->name,
                    'email' => $submission->submittedBy->email,
                ] : null,
                'reviewer' => $submission->reviewer ? [
                    'id' => $submission->reviewer->id,
                    'name' => $submission->reviewer->name,
                ] : null,
                'institution_course' => $submission->institutionCourse ? [
                    'id' => $submission->institutionCourse->id,
                    'course_code' => $submission->institutionCourse->course_code,
                    'institution' => [
                        'id' => $submission->institutionCourse->institution->id,
                        'abbreviation' => $submission->institutionCourse->institution->abbreviation,
                    ],
                ] : null,
                'related_question' => $submission->relatedQuestion ? [
                    'id' => $submission->relatedQuestion->id,
                    'content' => str($submission->relatedQuestion->content)->limit(200)->value(),
                ] : null,
                'related_topic' => $submission->relatedTopic ? [
                    'id' => $submission->relatedTopic->id,
                    'title' => $submission->relatedTopic->title,
                ] : null,
            ],
        ]);
    }

    public function approve(Request $request, ContentSubmission $submission, ContentReviewService $service): RedirectResponse
    {
        abort_unless($request->user()->role->hasPermission('review_submissions'), 403);

        $service->approveSubmission($submission, $request->user());

        return back()->with('success', 'Submission approved.');
    }

    public function reject(RejectSubmissionRequest $request, ContentSubmission $submission, ContentReviewService $service): RedirectResponse
    {
        abort_unless($request->user()->role->hasPermission('review_submissions'), 403);

        $service->rejectSubmission($submission, $request->user(), $request->validated('reviewer_notes'));

        return back()->with('success', 'Submission rejected.');
    }

    public function uploads(Request $request): Response
    {
        $submissions = ContentSubmission::query()
            ->with([
                'submittedBy:id,name,email',
                'institutionCourse:id,course_code,institution_id',
                'institutionCourse.institution:id,abbreviation',
            ])
            ->where('submission_type', ContentSubmissionType::PastQuestionUpload)
            ->when(
                $request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')),
                fn ($q) => $q->where('status', ContentSubmissionStatus::Pending)
            )
            ->orderBy('created_at', 'asc')
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $submissions->through(fn (ContentSubmission $s) => [
            'id' => $s->id,
            'submission_type' => $s->submission_type->value,
            'submission_type_label' => $s->submission_type->label(),
            'status' => $s->status->value,
            'status_label' => $s->status->label(),
            'submitted_by_name' => $s->submittedBy?->name ?? '—',
            'course_code' => $s->institutionCourse?->course_code,
            'institution_abbreviation' => $s->institutionCourse?->institution?->abbreviation,
            'has_images' => ! empty($s->images),
            'images' => $s->images,
            'content' => $s->content,
            'exam_year' => $s->exam_year,
            'created_at' => $s->created_at,
        ]);

        return Inertia::render('admin/review-queue/uploads', [
            'submissions' => $this->paginated($submissions),
            'filters' => $request->only(['status']),
            'statuses' => ContentSubmissionStatus::toSelectOptions(),
            'institutions' => Institution::query()
                ->where('is_active', true)
                ->orderBy('abbreviation')
                ->get(['id', 'name', 'abbreviation']),
            'enum_options' => [
                'question_types' => QuestionType::cases(),
                'difficulties' => QuestionDifficulty::cases(),
                'semesters' => [
                    ['value' => 'first', 'label' => 'First'],
                    ['value' => 'second', 'label' => 'Second'],
                ],
            ],
        ]);
    }

    public function transcribe(TranscribeUploadRequest $request, ContentSubmission $submission, ContentReviewService $service): RedirectResponse
    {
        abort_unless($request->user()->role->hasPermission('review_submissions'), 403);

        $service->transcribeUpload($submission, $request->validated('questions'), $request->user());

        return to_route('admin.review-queue.uploads')->with('success', 'Questions transcribed successfully.');
    }
}
