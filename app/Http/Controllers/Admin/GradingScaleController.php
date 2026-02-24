<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ScaleType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGradingScaleRequest;
use App\Http\Requests\Admin\UpdateGradingScaleRequest;
use App\Models\GradingScale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradingScaleController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $scales = GradingScale::query()
            ->withCount('assessmentTypes')
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('scale_type'), fn ($q) => $q->where('scale_type', $request->string('scale_type')))
            ->tap(fn ($query) => $this->applySorting($query, $request, [
                'name', 'scale_type', 'assessment_types_count',
            ]))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $scalesWithLabels = $scales->through(fn ($scale) => array_merge(
            $scale->toArray(),
            ['scale_type_label' => $scale->scale_type->label()]
        ));

        return Inertia::render('admin/grading-scales/index', [
            'gradingScales' => $this->paginated($scalesWithLabels),
            'filters' => $request->only(['search', 'scale_type', 'sort', 'direction']),
            'scaleTypes' => ScaleType::toSelectOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/grading-scales/create', [
            'scaleTypes' => ScaleType::toSelectOptions(),
        ]);
    }

    public function store(StoreGradingScaleRequest $request): RedirectResponse
    {
        GradingScale::create($request->validated());

        return to_route('admin.grading-scales.index')->with('success', 'Grading scale created successfully.');
    }

    public function edit(GradingScale $gradingScale): Response
    {
        return Inertia::render('admin/grading-scales/edit', [
            'gradingScale' => $gradingScale,
            'scaleTypes' => ScaleType::toSelectOptions(),
        ]);
    }

    public function update(UpdateGradingScaleRequest $request, GradingScale $gradingScale): RedirectResponse
    {
        $gradingScale->update($request->validated());

        return to_route('admin.grading-scales.index')->with('success', 'Grading scale updated successfully.');
    }
}
