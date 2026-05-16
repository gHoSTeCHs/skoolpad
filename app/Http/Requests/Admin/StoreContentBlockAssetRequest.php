<?php

namespace App\Http\Requests\Admin;

use App\Enums\AssetKind;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContentBlockAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>|string> */
    public function rules(): array
    {
        return [
            'content_block_id' => ['nullable', 'uuid', 'exists:content_blocks,id'],
            'question_id' => ['nullable', 'uuid', 'exists:questions,id'],
            'question_paper_id' => ['nullable', 'uuid', 'exists:question_papers,id'],

            'kind' => ['required', 'string', Rule::in(array_column(AssetKind::cases(), 'value'))],
            'excalidraw_json' => ['nullable', 'array'],
            'svg_payload' => ['nullable', 'string'],
            'alt_text' => ['nullable', 'string', 'max:500'],
            'caption' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $owners = collect([
                $this->input('content_block_id'),
                $this->input('question_id'),
                $this->input('question_paper_id'),
            ])->filter()->count();

            if ($owners !== 1) {
                $v->errors()->add('owner', 'Exactly one of content_block_id, question_id, question_paper_id must be provided.');
            }
        });
    }
}
