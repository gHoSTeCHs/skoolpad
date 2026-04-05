<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCurriculumSubjectRequest;
use App\Http\Requests\Admin\UpdateCurriculumSubjectRequest;
use App\Models\CurriculumSubject;
use App\Models\EducationSystem;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class CurriculumSubjectController extends Controller
{
    public function store(StoreCurriculumSubjectRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        Gate::authorize('create', Institution::class);

        $data = $request->validated();
        $data['education_system_id'] = $educationSystem->id;
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        CurriculumSubject::query()->create($data);

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Curriculum subject created.');
    }

    public function update(UpdateCurriculumSubjectRequest $request, CurriculumSubject $curriculumSubject): RedirectResponse
    {
        Gate::authorize('update', Institution::class);

        $curriculumSubject->update($request->validated());

        return to_route('admin.education-systems.show', $curriculumSubject->education_system_id)->with('success', 'Curriculum subject updated.');
    }

    public function destroy(CurriculumSubject $curriculumSubject): RedirectResponse
    {
        Gate::authorize('delete', Institution::class);

        $systemId = $curriculumSubject->education_system_id;
        $curriculumSubject->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Curriculum subject deleted.');
    }
}
