<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportCsvRequest;
use App\Http\Requests\Admin\ImportQuestionsRequest;
use App\Models\ImportLog;
use App\Services\Admin\ContentImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BulkImportController extends Controller
{
    use Paginates;

    public function __construct(
        private readonly ContentImportService $importService,
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', ImportLog::class);

        return Inertia::render('admin/import/index', [
            'import_types' => ImportType::toSelectOptions(),
        ]);
    }

    public function importTopics(ImportCsvRequest $request): RedirectResponse
    {
        Gate::authorize('import', ImportLog::class);

        return $this->handleImport($request, ImportType::Topics, 'topics');
    }

    public function importCourseMappings(ImportCsvRequest $request): RedirectResponse
    {
        Gate::authorize('import', ImportLog::class);

        return $this->handleImport($request, ImportType::CourseMappings, 'course_mappings');
    }

    public function importCourseOfferings(ImportCsvRequest $request): RedirectResponse
    {
        Gate::authorize('import', ImportLog::class);

        return $this->handleImport($request, ImportType::CourseOfferings, 'course_offerings');
    }

    public function importQuestions(ImportQuestionsRequest $request): RedirectResponse
    {
        Gate::authorize('import', ImportLog::class);

        $defaultStatus = $request->input('default_status', 'draft');

        if ($defaultStatus === 'published' && ! $request->user()->role->hasPermission('publish_content')) {
            abort(403, 'You do not have permission to publish questions directly.');
        }

        return $this->handleImport($request, ImportType::Questions, 'questions', $defaultStatus);
    }

    public function history(Request $request): Response
    {
        Gate::authorize('viewAny', ImportLog::class);

        $logs = ImportLog::query()
            ->with('processor:id,name')
            ->when($request->filled('import_type'), function ($query) use ($request) {
                $query->where('import_type', $request->string('import_type'));
            })
            ->tap(fn ($query) => $this->applySorting(
                $query,
                $request,
                ['created_at', 'status', 'import_type'],
                'created_at',
                'desc'
            ))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->through(fn ($log) => [
                'id' => $log->id,
                'import_type' => $log->import_type->value,
                'import_type_label' => $log->import_type->label(),
                'original_filename' => $log->original_filename,
                'status' => $log->status->value,
                'status_label' => $log->status->label(),
                'total_rows' => $log->total_rows,
                'success_count' => $log->success_count,
                'error_count' => $log->error_count,
                'errors' => $log->errors,
                'processed_by' => $log->processor?->name,
                'created_at' => $log->created_at->toDateTimeString(),
            ])
            ->withQueryString();

        return Inertia::render('admin/import/history', [
            'logs' => $this->paginated($logs),
            'filters' => $request->only(['import_type', 'sort', 'direction']),
            'import_types' => ImportType::toSelectOptions(),
            'import_statuses' => ImportStatus::toSelectOptions(),
        ]);
    }

    private function handleImport(Request $request, ImportType $importType, string $validationType, string $defaultStatus = 'draft'): RedirectResponse
    {
        $log = $this->importService->processImport(
            $request->file('file'),
            $importType,
            $validationType,
            $defaultStatus,
            $request->user(),
        );

        if ($log->status === ImportStatus::Failed) {
            return back()->with('importErrors', $log->errors);
        }

        return back()->with('success', 'Import queued successfully.');
    }
}
