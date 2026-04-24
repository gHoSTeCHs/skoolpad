<?php

namespace App\Http\Requests\Admin;

use App\Models\CanonicalTopic;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResetTopicContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $topic = $this->route('canonicalTopic');
        $expectedSlug = $topic instanceof CanonicalTopic ? $topic->slug : '';

        return [
            'confirm_slug' => ['required', 'string', Rule::in([$expectedSlug])],
        ];
    }

    public function messages(): array
    {
        return [
            'confirm_slug.in' => 'You must type the topic slug exactly to confirm a destructive reset.',
        ];
    }
}
