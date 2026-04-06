<?php

namespace App\Jobs;

use App\Enums\ImportStatus;
use App\Models\ImportLog;
use App\Services\Admin\ContentImportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessCsvImport implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(
        public string $importLogId,
        public string $csvPath,
        public string $importType,
        public string $defaultStatus = 'draft',
    ) {
        $this->onQueue('default');
    }

    public function handle(ContentImportService $service): void
    {
        $log = ImportLog::query()->findOrFail($this->importLogId);
        $log->update(['status' => ImportStatus::Processing]);

        $rows = $service->parseCsvFromPath($this->csvPath);

        $result = match ($this->importType) {
            'topics' => $service->importTopics($rows, $log),
            'course_mappings' => $service->importCourseMappings($rows, $log),
            'course_offerings' => $service->importCourseOfferings($rows, $log),
            'questions' => $service->importQuestions($rows, $log, $this->defaultStatus),
        };

        $log->update([
            'status' => $result->success ? ImportStatus::Completed : ImportStatus::Failed,
            'total_rows' => $result->totalRows,
            'success_count' => $result->successCount,
            'error_count' => $result->errorCount,
            'errors' => $result->errors,
        ]);

        Storage::delete($this->csvPath);
    }

    public function failed(\Throwable $exception): void
    {
        Storage::delete($this->csvPath);

        ImportLog::query()
            ->where('id', $this->importLogId)
            ->where('status', ImportStatus::Processing)
            ->update([
                'status' => ImportStatus::Failed,
                'errors' => [$exception->getMessage()],
            ]);
    }
}
