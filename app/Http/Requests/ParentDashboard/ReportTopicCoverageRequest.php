<?php

namespace App\Http\Requests\ParentDashboard;

use App\Enums\TopicCoverageStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportTopicCoverageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(TopicCoverageStatus::class)],
        ];
    }
}
