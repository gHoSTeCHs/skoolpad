<?php

namespace App\Http\Requests\Admin;

class LoadSchemeOfWorkRequest extends LoadLevelSubjectRequest
{
    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'term' => ['required', 'integer', 'min:1', 'max:3'],
        ]);
    }
}
