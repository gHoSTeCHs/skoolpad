<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCurriculumSubjectRequest;
use App\Http\Requests\Admin\UpdateCurriculumSubjectRequest;
use App\Models\CurriculumSubject;
use App\Models\EducationSystem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class CurriculumSubjectController extends Controller
{
    public function store(StoreCurriculumSubjectRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $data = $request->validated();
        $data['education_system_id'] = $educationSystem->id;
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        CurriculumSubject::create($data);

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Curriculum subject created.');
    }

    public function update(UpdateCurriculumSubjectRequest $request, CurriculumSubject $curriculumSubject): RedirectResponse
    {
        $curriculumSubject->update($request->validated());

        return to_route('admin.education-systems.show', $curriculumSubject->education_system_id)->with('success', 'Curriculum subject updated.');
    }

    public function destroy(CurriculumSubject $curriculumSubject): RedirectResponse
    {
        $systemId = $curriculumSubject->education_system_id;
        $curriculumSubject->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Curriculum subject deleted.');
    }
}
