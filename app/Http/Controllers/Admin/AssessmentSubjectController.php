<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAssessmentSubjectRequest;
use App\Http\Requests\Admin\UpdateAssessmentSubjectRequest;
use App\Models\AssessmentSubject;
use App\Models\AssessmentType;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class AssessmentSubjectController extends Controller
{
    public function store(StoreAssessmentSubjectRequest $request, AssessmentType $assessmentType): RedirectResponse
    {
        Gate::authorize('create', Institution::class);

        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $assessmentType->assessmentSubjects()->create($data);

        return back()->with('success', 'Assessment subject created.');
    }

    public function update(UpdateAssessmentSubjectRequest $request, AssessmentSubject $assessmentSubject): RedirectResponse
    {
        Gate::authorize('update', Institution::class);

        $assessmentSubject->update($request->validated());

        return back()->with('success', 'Assessment subject updated.');
    }

    public function destroy(AssessmentSubject $assessmentSubject): RedirectResponse
    {
        Gate::authorize('delete', Institution::class);

        $assessmentSubject->delete();

        return back()->with('success', 'Assessment subject deleted.');
    }
}
