<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessCsvImport;
use App\Models\ImportLog;
use App\Services\ContentImportService;
use Illuminate\Http\JsonResponse;
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
            'import_types' => array_map(
                fn (ImportType $type) => ['value' => $type->value, 'label' => $type->label()],
                ImportType::cases()
            ),
        ]);
    }

    public function importTopics(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        $rows = $this->parseCsv($request->file('file'));
        $log = ImportLog::create([
            'import_type' => ImportType::Topics,
            'original_filename' => $request->file('file')->getClientOriginalName(),
            'status' => ImportStatus::Pending,
            'total_rows' => count($rows),
            'processed_by' => $request->user()->id,
        ]);

        $service = new ContentImportService;
        $validation = $service->validateCsv($rows, 'topics');

        if (! $validation->isValid) {
            $log->update([
                'status' => ImportStatus::Failed,
                'errors' => $validation->errors,
            ]);

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validation->errors,
            ], 422);
        }

        ProcessCsvImport::dispatch($log->id, $rows, 'topics');

        return response()->json(['message' => 'Import queued successfully.', 'import_log_id' => $log->id]);
    }

    public function importCourseMappings(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        $rows = $this->parseCsv($request->file('file'));
        $log = ImportLog::create([
            'import_type' => ImportType::CourseMappings,
            'original_filename' => $request->file('file')->getClientOriginalName(),
            'status' => ImportStatus::Pending,
            'total_rows' => count($rows),
            'processed_by' => $request->user()->id,
        ]);

        $service = new ContentImportService;
        $validation = $service->validateCsv($rows, 'course_mappings');

        if (! $validation->isValid) {
            $log->update([
                'status' => ImportStatus::Failed,
                'errors' => $validation->errors,
            ]);

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validation->errors,
            ], 422);
        }

        ProcessCsvImport::dispatch($log->id, $rows, 'course_mappings');

        return response()->json(['message' => 'Import queued successfully.', 'import_log_id' => $log->id]);
    }

    public function importCourseOfferings(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        $rows = $this->parseCsv($request->file('file'));
        $log = ImportLog::create([
            'import_type' => ImportType::CourseOfferings,
            'original_filename' => $request->file('file')->getClientOriginalName(),
            'status' => ImportStatus::Pending,
            'total_rows' => count($rows),
            'processed_by' => $request->user()->id,
        ]);

        $service = new ContentImportService;
        $validation = $service->validateCsv($rows, 'course_offerings');

        if (! $validation->isValid) {
            $log->update([
                'status' => ImportStatus::Failed,
                'errors' => $validation->errors,
            ]);

            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validation->errors,
            ], 422);
        }

        ProcessCsvImport::dispatch($log->id, $rows, 'course_offerings');

        return response()->json(['message' => 'Import queued successfully.', 'import_log_id' => $log->id]);
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
            ->paginate(15)
            ->through(fn ($log) => [
                'id' => $log->id,
                'import_type' => $log->import_type->value,
                'original_filename' => $log->original_filename,
                'status' => $log->status->value,
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
            'importTypes' => ImportType::values(),
        ]);
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
