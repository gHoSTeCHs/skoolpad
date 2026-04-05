<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCurriculumTierRequest;
use App\Http\Requests\Admin\UpdateCurriculumTierRequest;
use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class CurriculumTierController extends Controller
{
    public function store(StoreCurriculumTierRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $data = $request->validated();
        $data['education_system_id'] = $educationSystem->id;
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        CurriculumTier::query()->create($data);

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Curriculum tier created.');
    }

    public function update(UpdateCurriculumTierRequest $request, CurriculumTier $curriculumTier): RedirectResponse
    {
        $curriculumTier->update($request->validated());

        return to_route('admin.education-systems.show', $curriculumTier->education_system_id)->with('success', 'Curriculum tier updated.');
    }

    public function destroy(CurriculumTier $curriculumTier): RedirectResponse
    {
        $systemId = $curriculumTier->education_system_id;
        $curriculumTier->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Curriculum tier deleted.');
    }
}
