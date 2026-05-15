<?php

namespace App\Http\Requests\Admin;

use App\Enums\BloomLevel;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Relevance;
use App\Models\Question;
use App\Rules\ResponseConfigValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $parentId = $this->input('parent_question_id');
        if (! $parentId) {
            return;
        }

        $parent = Question::query()->find($parentId);
        if (! $parent) {
            return;
        }

        $this->merge([
            'question_paper_id' => $this->input('question_paper_id') ?: $parent->question_paper_id,
            'question_section_id' => $this->input('question_section_id') ?: $parent->question_section_id,
            'institution_course_id' => $this->input('institution_course_id') ?: $parent->institution_course_id,
            'exam_subject_id' => $this->input('exam_subject_id') ?: $parent->exam_subject_id,
        ]);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'question_paper_id' => ['nullable', 'uuid', 'exists:question_papers,id'],
            'question_section_id' => ['nullable', 'uuid', 'exists:question_sections,id'],
            'parent_question_id' => ['nullable', 'uuid', 'exists:questions,id'],
            'institution_course_id' => ['nullable', 'uuid', 'exists:institution_courses,id',
                Rule::requiredIf(fn () => ! $this->filled('exam_subject_id') && ! $this->filled('question_paper_id'))],
            'exam_subject_id' => ['nullable', 'uuid', 'exists:exam_subjects,id'],
            'question_type' => ['required', 'string', Rule::in(QuestionType::values())],
            'content' => ['required', 'string'],
            'content_doc' => ['nullable', 'array'],
            'year' => ['nullable', 'integer', 'min:1990', 'max:'.date('Y')],
            'semester' => ['nullable', 'string', Rule::in(['first', 'second'])],
            'marks' => ['nullable', 'integer', 'min:1'],
            'difficulty_level' => ['nullable', 'string', Rule::in(QuestionDifficulty::values())],
            'bloom_level' => ['nullable', 'string', Rule::in(array_column(BloomLevel::cases(), 'value'))],
            'source' => ['required', 'string', Rule::in(QuestionSource::values())],
            'status' => ['required', 'string', Rule::in([QuestionStatus::Draft->value, QuestionStatus::InReview->value])],
            'response_config' => ['nullable', new ResponseConfigValidator($this->input('question_type', ''))],
            'topic_ids' => ['nullable', 'array'],
            'topic_ids.*' => ['uuid', 'distinct', 'exists:canonical_topics,id'],
            'primary_topic_id' => ['nullable', 'uuid', 'exists:canonical_topics,id'],
            'block_links' => ['nullable', 'array'],
            'block_links.*.content_block_id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'block_links.*.relevance' => ['required', Rule::enum(Relevance::class)],
            'sub_questions' => ['nullable', 'array', 'max:30'],
            'sub_questions.*.id' => ['nullable', 'uuid', 'exists:questions,id'],
            'sub_questions.*.question_type' => ['required', 'string', Rule::in(QuestionType::values())],
            'sub_questions.*.content' => ['required', 'string'],
            'sub_questions.*.marks' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'sub_questions.*.sort_order' => ['required', 'integer', 'min:0'],
            'sub_questions.*.response_config' => ['nullable', 'array'],
            'choice_group' => ['nullable', 'array'],
            'choice_group.required' => ['nullable', 'array'],
            'choice_group.required.*' => ['string', 'max:32'],
            'choice_group.chooseN' => ['nullable', 'integer', 'min:1', 'max:20'],
            'choice_group.optional' => ['nullable', 'array'],
            'choice_group.optional.*' => ['string', 'max:32'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $topicIds = $this->input('topic_ids', []);
                $primaryId = $this->input('primary_topic_id');

                if ($primaryId && is_array($topicIds) && ! empty($topicIds) && ! in_array($primaryId, $topicIds)) {
                    $validator->errors()->add('primary_topic_id', 'The primary topic must be one of the selected topics.');
                }
            },
        ];
    }
}
