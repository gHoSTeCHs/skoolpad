<?php

namespace App\Http\Requests\ParentDashboard;

use App\Enums\ParentalRelationship;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateParentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'relationship' => ['required', Rule::in(array_column(ParentalRelationship::cases(), 'value'))],
            'phone_number' => ['nullable', 'string', 'max:20'],
        ];
    }
}
