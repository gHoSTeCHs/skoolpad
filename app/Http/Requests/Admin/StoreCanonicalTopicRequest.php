<?php

namespace App\Http\Requests\Admin;

use App\Enums\TopicDifficulty;
use App\Models\CanonicalTopic;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCanonicalTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255',
                Rule::unique('canonical_topics', 'slug')
                    ->where('discipline_id', $this->discipline_id),
            ],
            'discipline_id' => ['required', 'string', 'exists:disciplines,id'],
            'parent_topic_id' => ['nullable', 'string', 'exists:canonical_topics,id'],
            'difficulty_level' => ['required', 'string', Rule::in(TopicDifficulty::values())],
            'content' => ['required', 'array'],
            'content_plain' => ['nullable', 'string'],
            'simplified_content' => ['nullable', 'array'],
            'summary' => ['nullable', 'string', 'max:1000'],
            'estimated_read_minutes' => ['nullable', 'integer', 'min:1', 'max:999'],
            'is_published' => ['nullable', 'boolean'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*.id' => ['required_with:prerequisites', 'string', 'exists:canonical_topics,id'],
            'prerequisites.*.is_hard_prerequisite' => ['required_with:prerequisites', 'boolean'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->parent_topic_id) {
                    $parent = CanonicalTopic::find($this->parent_topic_id);

                    if ($parent && $parent->discipline_id !== $this->discipline_id) {
                        $validator->errors()->add(
                            'parent_topic_id',
                            'Parent topic must belong to the same discipline.'
                        );
                    }
                }
            },
        ];
    }
}
