<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessCsvImport;
use App\Models\ImportLog;
use App\Services\ContentImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class BulkImportController extends Controller
{
    use Paginates;

    public function index(): Response
    {
        return Inertia::render('admin/import/index', [
            'import_types' => ImportType::toSelectOptions(),
        ]);
    }

    public function importTopics(Request $request): RedirectResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        return $this->processImport($request, ImportType::Topics, 'topics');
    }

    public function importCourseMappings(Request $request): RedirectResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        return $this->processImport($request, ImportType::CourseMappings, 'course_mappings');
    }

    public function importCourseOfferings(Request $request): RedirectResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        return $this->processImport($request, ImportType::CourseOfferings, 'course_offerings');
    }

    public function importQuestions(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'default_status' => 'nullable|string|in:draft,published',
        ]);

        $defaultStatus = $request->input('default_status', 'draft');

        if ($defaultStatus === 'published' && ! $request->user()->role->hasPermission('publish_content')) {
            abort(403, 'You do not have permission to publish questions directly.');
        }

        return $this->processImport($request, ImportType::Questions, 'questions', $defaultStatus);
    }

    public function history(Request $request): Response
    {
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

    private function processImport(Request $request, ImportType $importType, string $validationType, string $defaultStatus = 'draft'): RedirectResponse
    {
        $rows = $this->parseCsv($request->file('file'));
        $log = ImportLog::create([
            'import_type' => $importType,
            'original_filename' => $request->file('file')->getClientOriginalName(),
            'status' => ImportStatus::Pending,
            'total_rows' => count($rows),
            'processed_by' => $request->user()->id,
        ]);

        $service = new ContentImportService;
        $validation = $service->validateCsv($rows, $validationType);

        if (! $validation->isValid) {
            $log->update([
                'status' => ImportStatus::Failed,
                'errors' => $validation->errors,
            ]);

            return back()->with('importErrors', $validation->errors);
        }

        ProcessCsvImport::dispatch($log->id, $rows, $validationType, $defaultStatus);

        return back()->with('success', 'Import queued successfully.');
    }

    /** @return array<int, array<string, string>> */
    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $rows = [];

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) === count($header)) {
                $rows[] = array_combine($header, $data);
            }
        }

        fclose($handle);

        return $rows;
    }
}
