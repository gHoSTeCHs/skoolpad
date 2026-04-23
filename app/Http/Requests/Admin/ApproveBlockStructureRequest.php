<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApproveBlockStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'topic_key' => ['required', 'string', 'max:255'],
            'blocks' => ['required', 'array', 'min:4'],
            'blocks.*.title' => ['required', 'string', 'max:300'],
            'blocks.*.slug' => ['required', 'string', 'max:300'],
            'blocks.*.block_type' => ['required', 'string', 'in:container,text,code,diagram,example,exercise,quiz,reference,comparison'],
            'blocks.*.is_container' => ['required', 'boolean'],
            'blocks.*.depth_level' => ['required', 'integer', 'min:0', 'max:5'],
            'blocks.*.parent_index' => ['nullable', 'integer', 'min:0'],
            'blocks.*.sort_order' => ['required', 'integer', 'min:1'],
            'blocks.*.estimated_read_time' => ['nullable', 'integer', 'min:1', 'max:30'],
            'blocks.*.difficulty_level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'blocks.*.bloom_level' => ['nullable', 'string', 'in:remember,understand,apply,analyze,evaluate,create'],
            'blocks.*.visualization' => ['nullable', 'array'],
            'blocks.*.visualization.recommended' => ['boolean'],
            'blocks.*.visualization.priority' => ['nullable', 'string', 'in:high,medium,low'],
            'blocks.*.visualization.primitive_type' => ['nullable', 'string'],
            'blocks.*.visualization.interaction_mode' => ['nullable', 'string', 'in:watch,interactive,challenge'],
            'blocks.*.visualization.description' => ['nullable', 'string'],
            'blocks.*.content_guidance' => ['required', 'string'],
            'topic_title' => ['required', 'string', 'max:500'],
            'topic_slug' => ['required', 'string', 'max:500'],
            'topic_summary' => ['required', 'string', 'max:1000'],
            'estimated_total_minutes' => ['required', 'integer', 'min:1'],
        ];
    }
}
