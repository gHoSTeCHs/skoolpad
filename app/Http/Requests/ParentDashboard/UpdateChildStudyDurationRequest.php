<?php

namespace App\Http\Requests\ParentDashboard;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChildStudyDurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'study_goal_minutes' => ['required', 'integer', 'in:15,30,45,60'],
        ];
    }
}
