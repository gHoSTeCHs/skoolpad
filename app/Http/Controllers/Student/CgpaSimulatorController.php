<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\CalculateCgpaRequest;
use App\Http\Requests\Student\ReverseCalculateCgpaRequest;
use App\Http\Requests\Student\StoreCgpaSimulationRequest;
use App\Http\Requests\Student\UpdateCgpaSimulationRequest;
use App\Models\CgpaSimulation;
use App\Services\Student\CgpaSimulatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CgpaSimulatorController extends Controller
{
    use Paginates;

    private const MAX_SIMULATIONS = 10;

    public function __construct(
        private readonly CgpaSimulatorService $service,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;
        $isSecondary = $profile?->isSecondary() ?? false;

        $gradingScale = $isSecondary ? null : $this->service->getGradingScale($user);

        $simulations = $user->cgpaSimulations()
            ->latest()
            ->get()
            ->map(fn (CgpaSimulation $sim) => [
                'id' => $sim->id,
                'name' => $sim->name,
                'mode' => $sim->mode,
                'current_cgpa' => (float) $sim->current_cgpa,
                'current_credit_hours' => $sim->current_credit_hours,
                'projected_grades' => $sim->projected_grades,
                'projected_cgpa' => (float) $sim->projected_cgpa,
                'semester_data' => $sim->semester_data,
                'target_cgpa' => $sim->target_cgpa ? (float) $sim->target_cgpa : null,
                'classification' => $gradingScale
                    ? $this->service->classifyCgpa((float) $sim->projected_cgpa, $gradingScale)
                    : null,
                'updated_at' => $sim->updated_at->toISOString(),
            ]);

        $enrolledCourses = ($profile && ! $isSecondary)
            ? $this->service->getEnrolledCourses($profile)
            : collect();

        $levelProgression = $isSecondary ? [] : $this->service->getLevelProgression($user);

        return Inertia::render('cgpa-simulator/index', [
            'simulations' => $simulations,
            'gradingScale' => $gradingScale ? [
                'id' => $gradingScale->id,
                'name' => $gradingScale->name,
                'scale_type' => $gradingScale->scale_type->value,
                'scale_max' => (float) $gradingScale->scale_max,
                'grade_boundaries' => $gradingScale->grade_boundaries
                ? collect($gradingScale->grade_boundaries)->map(fn (array $b) => [
                    'label' => $b['label'],
                    'min' => $b['min'],
                    'max' => $b['max'],
                    'gp' => (float) ($b['gp'] ?? $b['points'] ?? 0),
                    'is_pass' => $b['is_pass'] ?? true,
                ])->all()
                : [],
                'classification_labels' => $gradingScale->classification_labels,
            ] : null,
            'enrolledCourses' => $enrolledCourses,
            'isSecondary' => $isSecondary,
            'levelProgression' => $levelProgression,
        ]);
    }

    public function store(StoreCgpaSimulationRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->cgpaSimulations()->count() >= self::MAX_SIMULATIONS) {
            return redirect()->back()->withErrors([
                'limit' => 'You can save a maximum of '.self::MAX_SIMULATIONS.' simulations.',
            ]);
        }

        $gradingScale = $this->service->getGradingScale($user);

        if (! $gradingScale) {
            abort(403);
        }

        $validated = $request->validated();

        $projection = $this->service->calculateProjectedCgpa(
            (float) $validated['current_cgpa'],
            (int) $validated['current_credit_hours'],
            $validated['projected_grades'],
            $gradingScale,
        );

        $user->cgpaSimulations()->create([
            ...$validated,
            'grading_scale_id' => $gradingScale->id,
            'projected_cgpa' => $projection['projected_cgpa'],
        ]);

        return redirect()->route('cgpa-simulator.index')
            ->with('success', 'Simulation saved.');
    }

    public function update(UpdateCgpaSimulationRequest $request, CgpaSimulation $simulation): RedirectResponse
    {
        Gate::authorize('update', $simulation);

        $gradingScale = $this->service->getGradingScale($request->user());

        if (! $gradingScale) {
            abort(403);
        }

        $validated = $request->validated();

        $projection = $this->service->calculateProjectedCgpa(
            (float) $validated['current_cgpa'],
            (int) $validated['current_credit_hours'],
            $validated['projected_grades'],
            $gradingScale,
        );

        $simulation->update([
            ...$validated,
            'grading_scale_id' => $gradingScale->id,
            'projected_cgpa' => $projection['projected_cgpa'],
        ]);

        return redirect()->route('cgpa-simulator.index')
            ->with('success', 'Simulation updated.');
    }

    public function destroy(CgpaSimulation $simulation, Request $request): RedirectResponse
    {
        Gate::authorize('delete', $simulation);

        $simulation->delete();

        return redirect()->route('cgpa-simulator.index')
            ->with('success', 'Simulation deleted.');
    }

    public function calculate(CalculateCgpaRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $gradingScale = $this->service->getGradingScale($request->user());

        if (! $gradingScale) {
            return response()->json(['error' => 'No grading scale found.'], 422);
        }

        $result = $this->service->calculateProjectedCgpa(
            (float) $validated['current_cgpa'],
            (int) $validated['current_credit_hours'],
            $validated['projected_grades'],
            $gradingScale,
        );

        return response()->json($result);
    }

    public function reverseCalculate(ReverseCalculateCgpaRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $gradingScale = $this->service->getGradingScale($request->user());

        if (! $gradingScale) {
            return response()->json(['error' => 'No grading scale found.'], 422);
        }

        $result = $this->service->calculateRequiredGpa(
            (float) $validated['current_cgpa'],
            (int) $validated['current_credit_hours'],
            (float) $validated['target_cgpa'],
            (int) $validated['remaining_credits'],
            $gradingScale,
        );

        return response()->json($result);
    }
}
