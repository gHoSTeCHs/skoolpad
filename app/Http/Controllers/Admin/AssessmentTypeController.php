<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAssessmentTypeRequest;
use App\Http\Requests\Admin\UpdateAssessmentTypeRequest;
use App\Models\AssessmentType;
use App\Models\EducationSystem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class AssessmentTypeController extends Controller
{
    public function store(StoreAssessmentTypeRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $data = $request->validated();
        $data['education_system_id'] = $educationSystem->id;
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        AssessmentType::query()->create($data);

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Assessment type created.');
    }

    public function update(UpdateAssessmentTypeRequest $request, AssessmentType $assessmentType): RedirectResponse
    {
        $assessmentType->update($request->validated());

        return to_route('admin.education-systems.show', $assessmentType->education_system_id)->with('success', 'Assessment type updated.');
    }

    public function destroy(AssessmentType $assessmentType): RedirectResponse
    {
        $systemId = $assessmentType->education_system_id;
        $assessmentType->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Assessment type deleted.');
    }
}
