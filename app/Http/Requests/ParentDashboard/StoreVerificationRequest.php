<?php

namespace App\Http\Requests\ParentDashboard;

use App\Enums\VerificationResult;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'responses' => ['required', 'array'],
            'responses.explain_checklist' => ['nullable', 'array'],
            'responses.true_false' => ['nullable', 'array'],
            'responses.true_false.*.child_answer' => ['required_with:responses.true_false', 'boolean'],
            'responses.mcq_answers' => ['nullable', 'array'],
            'responses.mcq_answers.*.question_id' => ['required_with:responses.mcq_answers', 'uuid', 'exists:questions,id'],
            'overall_result' => ['required', Rule::enum(VerificationResult::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
