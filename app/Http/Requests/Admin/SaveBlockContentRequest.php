<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SaveBlockContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * v1 scope: admins can edit the Tiptap document only. Contract fields
     * (summary_sentence / key_terms_introduced / symbols_used / formulas_used)
     * can only change via regeneration. Flip these four rules to `required|array`
     * etc. in v2 to unlock the admin edit surface.
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'array'],
            'content.type' => ['required', 'string', 'in:doc'],
            'content.content' => ['required', 'array', 'min:1'],
            'summary_sentence' => ['prohibited'],
            'key_terms_introduced' => ['prohibited'],
            'symbols_used' => ['prohibited'],
            'formulas_used' => ['prohibited'],
            'word_count' => ['nullable', 'integer', 'min:0'],
            'nigerian_context_used' => ['nullable', 'boolean'],
        ];
    }
}
