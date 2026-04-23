<?php

namespace App\Http\Requests\Admin;

use App\Enums\ContentProjectMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreContentProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(array_column(ContentProjectMode::cases(), 'value'))],
            'education_level_id' => ['nullable', 'uuid', 'exists:education_levels,id', 'required_if:mode,secondary'],
            'curriculum_subject_id' => ['nullable', 'uuid', 'exists:curriculum_subjects,id', 'required_if:mode,secondary'],
            'discipline_id' => ['nullable', 'uuid', 'exists:disciplines,id', 'required_if:mode,tertiary'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $this->checkForDuplicateProject($validator);
            },
        ];
    }

    private function checkForDuplicateProject(Validator $validator): void
    {
        $query = \App\Models\ContentProject::query()
            ->where('mode', $this->mode)
            ->whereNotIn('status', ['complete']);

        if ($this->mode === ContentProjectMode::Secondary->value) {
            $query->where('education_level_id', $this->education_level_id)
                ->where('curriculum_subject_id', $this->curriculum_subject_id);
        } else {
            $query->where('discipline_id', $this->discipline_id);
        }

        if ($query->exists()) {
            $validator->errors()->add(
                'mode',
                'A content project with this configuration already exists and is in progress.'
            );
        }
    }
}
