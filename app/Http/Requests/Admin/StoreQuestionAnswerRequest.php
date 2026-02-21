<?php

namespace App\Http\Requests\Admin;

use App\Enums\AnswerDepthLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $questionId = $this->route('question')?->id;

        return [
            'depth_level' => [
                'required',
                'string',
                Rule::in(AnswerDepthLevel::values()),
                Rule::unique('question_answers', 'depth_level')
                    ->where('question_id', $questionId)
                    ->ignore($this->route('answer')),
            ],
            'content' => ['required', 'array'],
            'content_plain' => ['nullable', 'string'],
            'is_published' => ['required', 'boolean'],
        ];
    }
}
