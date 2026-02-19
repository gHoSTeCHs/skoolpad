<?php

namespace App\Jobs;

use App\Enums\ImportStatus;
use App\Models\ImportLog;
use App\Services\ContentImportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessCsvImport implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    /**
     * @param  array<int, array<string, string>>  $rows
     */
    public function __construct(
        public string $importLogId,
        public array $rows,
        public string $importType,
    ) {
        $this->onQueue('default');
    }

    public function handle(ContentImportService $service): void
    {
        $log = ImportLog::findOrFail($this->importLogId);
        $log->update(['status' => ImportStatus::Processing]);

        $result = match ($this->importType) {
            'topics' => $service->importTopics($this->rows, $log),
            'course_mappings' => $service->importCourseMappings($this->rows, $log),
            'course_offerings' => $service->importCourseOfferings($this->rows, $log),
        };

        $log->update([
            'status' => $result->success ? ImportStatus::Completed : ImportStatus::Failed,
            'total_rows' => $result->totalRows,
            'success_count' => $result->successCount,
            'error_count' => $result->errorCount,
            'errors' => $result->errors,
        ]);
    }
}
