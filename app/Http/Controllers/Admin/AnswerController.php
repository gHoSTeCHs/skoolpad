<?php

namespace App\Http\Controllers\Admin;

use App\ContentStudio\Support\TiptapDiagramScope;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuestionAnswerRequest;
use App\Models\Question;
use App\Models\QuestionAnswer;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class AnswerController extends Controller
{
    public function store(StoreQuestionAnswerRequest $request, Question $question): RedirectResponse
    {
        Gate::authorize('manageAnswers', Question::class);

        $data = $request->validated();
        $this->guardDiagramScope($data, $question);
        $this->guardAltTextOnPublish($data, null);

        $data['question_id'] = $question->id;
        $data['created_by'] = $request->user()->id;

        QuestionAnswer::query()->create($data);

        return back()->with('success', 'Answer saved.');
    }

    public function update(StoreQuestionAnswerRequest $request, Question $question, QuestionAnswer $answer): RedirectResponse
    {
        Gate::authorize('manageAnswers', Question::class);

        $data = $request->validated();
        $this->guardDiagramScope($data, $question);
        $this->guardAltTextOnPublish($data, $answer);

        $answer->update($data);

        return back()->with('success', 'Answer updated.');
    }

    /**
     * CP12 — cross-document diagram scope check. Answers attach to a question;
     * diagram nodes inside answer content must reference assets owned by THAT
     * question.
     *
     * @param  array<string, mixed>  $data
     */
    private function guardDiagramScope(array $data, Question $question): void
    {
        if (! is_array($data['content'] ?? null)) {
            return;
        }
        $violations = TiptapDiagramScope::findScopeViolations(
            $data['content'],
            'question_id',
            $question->id,
        );
        if (! empty($violations)) {
            throw new DomainException(
                'Answer content references diagram assets from other documents: '
                .json_encode($violations)
            );
        }
    }

    /**
     * CP12 — alt-text required for every diagram in an answer at the moment the
     * answer becomes published. Blocks the save before the row flips.
     *
     * @param  array<string, mixed>  $data
     */
    private function guardAltTextOnPublish(array $data, ?QuestionAnswer $existing): void
    {
        $publishingNow = ! empty($data['is_published'])
            && (! $existing || ! $existing->is_published);
        if (! $publishingNow) {
            return;
        }
        if (! is_array($data['content'] ?? null)) {
            return;
        }
        $unlabeled = TiptapDiagramScope::findUnlabeledAssetIds($data['content']);
        if (! empty($unlabeled)) {
            throw new DomainException(
                'Cannot publish answer: '.count($unlabeled).' diagram'
                .(count($unlabeled) === 1 ? '' : 's')
                .' missing alt-text. Asset IDs: '.implode(', ', $unlabeled)
            );
        }
    }
}
