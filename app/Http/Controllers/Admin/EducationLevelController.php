<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEducationLevelRequest;
use App\Http\Requests\Admin\UpdateEducationLevelRequest;
use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use Illuminate\Http\RedirectResponse;

class EducationLevelController extends Controller
{
    public function store(StoreEducationLevelRequest $request, CurriculumTier $curriculumTier): RedirectResponse
    {
        $data = $request->validated();
        $data['curriculum_tier_id'] = $curriculumTier->id;

        EducationLevel::query()->create($data);

        return to_route('admin.education-systems.show', $curriculumTier->education_system_id)->with('success', 'Education level created.');
    }

    public function update(UpdateEducationLevelRequest $request, EducationLevel $educationLevel): RedirectResponse
    {
        $educationLevel->update($request->validated());

        return to_route('admin.education-systems.show', $educationLevel->curriculumTier->education_system_id)->with('success', 'Education level updated.');
    }

    public function destroy(EducationLevel $educationLevel): RedirectResponse
    {
        $systemId = $educationLevel->curriculumTier->education_system_id;
        $educationLevel->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Education level deleted.');
    }
}
