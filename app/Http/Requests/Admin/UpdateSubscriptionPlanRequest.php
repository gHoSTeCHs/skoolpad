<?php

namespace App\Http\Requests\Admin;

use App\Enums\AnswerDepthLevel;
use App\Enums\BillingPeriod;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:255'],
            'price_ngn' => ['required', 'integer', 'min:0'],
            'billing_period' => ['required', 'string', 'in:'.implode(',', array_column(BillingPeriod::cases(), 'value'))],
            'features' => ['required', 'array'],
            'features.daily_ocr' => ['required', 'integer', 'min:-1'],
            'features.daily_ai_messages' => ['required', 'integer', 'min:-1'],
            'features.daily_gradings' => ['required', 'integer', 'min:-1'],
            'features.answer_depths' => ['required', 'array', 'min:1'],
            'features.answer_depths.*' => ['required', 'string', 'in:'.implode(',', AnswerDepthLevel::values())],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
