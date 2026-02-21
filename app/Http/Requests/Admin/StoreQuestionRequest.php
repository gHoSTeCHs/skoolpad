<?php

namespace App\Http\Requests\Admin;

use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'institution_course_id' => ['required', 'string', 'exists:institution_courses,id'],
            'question_type' => ['required', 'string', Rule::in(QuestionType::values())],
            'content' => ['required', 'string'],
            'year' => ['nullable', 'integer', 'min:1990', 'max:'.date('Y')],
            'semester' => ['nullable', 'string', Rule::in(['first', 'second'])],
            'marks' => ['nullable', 'integer', 'min:1'],
            'difficulty_level' => ['nullable', 'string', Rule::in(QuestionDifficulty::values())],
            'source' => ['required', 'string', Rule::in(QuestionSource::values())],
            'status' => ['required', 'string', Rule::in([QuestionStatus::Draft->value, QuestionStatus::InReview->value])],
            'options' => ['required_if:question_type,mcq', 'array', 'min:2', 'max:5'],
            'options.*.content' => ['required_with:options', 'string'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
            'topic_ids' => ['required', 'array', 'min:1'],
            'topic_ids.*' => ['required', 'string', 'distinct', 'exists:canonical_topics,id'],
            'primary_topic_id' => ['required', 'string', 'exists:canonical_topics,id'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->input('question_type') === 'mcq' && is_array($this->input('options'))) {
                    $correctCount = collect($this->input('options'))
                        ->filter(fn ($opt) => ! empty($opt['is_correct']))
                        ->count();

                    if ($correctCount !== 1) {
                        $validator->errors()->add('options', 'Exactly one option must be marked as correct.');
                    }
                }

                $topicIds = $this->input('topic_ids', []);
                $primaryId = $this->input('primary_topic_id');

                if ($primaryId && is_array($topicIds) && ! in_array($primaryId, $topicIds)) {
                    $validator->errors()->add('primary_topic_id', 'The primary topic must be one of the selected topics.');
                }
            },
        ];
    }
}
