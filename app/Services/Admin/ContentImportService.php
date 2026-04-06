<?php

namespace App\Services\Admin;

use App\DataTransferObjects\ImportResult;
use App\DataTransferObjects\ValidationResult;
use App\Enums\AnswerDepthLevel;
use App\Enums\CourseScope;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\TopicDifficulty;
use App\Enums\TopicWeight;
use App\Models\CanonicalTopic;
use App\Models\CourseDepartmentOffering;
use App\Models\CourseTopicMapping;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\ImportLog;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionTopicLink;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class ContentImportService
{
    public function processImport(UploadedFile $file, \App\Enums\ImportType $importType, string $validationType, string $defaultStatus, User $user): ImportLog
    {
        $rows = $this->parseCsv($file);
        $log = ImportLog::query()->create([
            'import_type' => $importType,
            'original_filename' => $file->getClientOriginalName(),
            'status' => \App\Enums\ImportStatus::Pending,
            'total_rows' => count($rows),
            'processed_by' => $user->id,
        ]);

        $validation = $this->validateCsv($rows, $validationType);

        if (! $validation->isValid) {
            $log->update([
                'status' => \App\Enums\ImportStatus::Failed,
                'errors' => $validation->errors,
            ]);

            return $log;
        }

        $csvPath = $file->storeAs('imports/pending', $log->id.'.csv');
        \App\Jobs\ProcessCsvImport::dispatch($log->id, $csvPath, $validationType, $defaultStatus);

        return $log;
    }

    /** @return array<int, array<string, string>> */
    public function parseCsv(UploadedFile $file): array
    {
        return $this->parseCsvHandle(fopen($file->getRealPath(), 'r'));
    }

    /** @return array<int, array<string, string>> */
    public function parseCsvFromPath(string $storagePath): array
    {
        $fullPath = \Illuminate\Support\Facades\Storage::path($storagePath);

        return $this->parseCsvHandle(fopen($fullPath, 'r'));
    }

    /**
     * @param  resource  $handle
     * @return array<int, array<string, string>>
     */
    private function parseCsvHandle($handle): array
    {
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

    /** @param array<int, array<string, string>> $rows */
    public function validateCsv(array $rows, string $importType): ValidationResult
    {
        $errors = match ($importType) {
            'topics' => $this->validateTopicRows($rows),
            'course_mappings' => $this->validateCourseMappingRows($rows),
            'course_offerings' => $this->validateCourseOfferingRows($rows),
            'questions' => $this->validateQuestionRows($rows),
            default => ["Unknown import type: {$importType}"],
        };

        if (count($errors) > 0) {
            return ValidationResult::fail($errors);
        }

        return ValidationResult::pass();
    }

    /** @param array<int, array<string, string>> $rows */
    public function importTopics(array $rows, ImportLog $log): ImportResult
    {
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        $disciplineSlugs = collect($rows)->pluck('discipline_slug')->filter()->unique()->values()->all();
        $disciplines = Discipline::query()->whereIn('slug', $disciplineSlugs)->pluck('id', 'slug')->all();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $disciplineId = $disciplines[$row['discipline_slug']] ?? null;

                CanonicalTopic::query()->updateOrCreate(
                    [
                        'discipline_id' => $disciplineId,
                        'slug' => Str::slug($row['title']),
                    ],
                    [
                        'title' => $row['title'],
                        'content' => $this->markdownToTiptap($row['content_markdown']),
                        'content_plain' => strip_tags($row['content_markdown']),
                        'difficulty_level' => $row['difficulty_level'],
                        'is_published' => true,
                    ]
                );

                $successCount++;
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Row {$rowNumber}: {$e->getMessage()}";
            }
        }

        return new ImportResult(
            success: $errorCount === 0,
            totalRows: count($rows),
            successCount: $successCount,
            errorCount: $errorCount,
            errors: $errors,
        );
    }

    /** @param array<int, array<string, string>> $rows */
    public function importCourseMappings(array $rows, ImportLog $log): ImportResult
    {
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        $institutions = $this->fetchInstitutionsByAbbreviation($rows);
        $disciplines = $this->fetchDisciplinesBySlug($rows);
        $courses = $this->fetchCoursesByInstitutionAndCode($rows, $institutions);
        $topics = $this->fetchTopicsByDisciplineAndSlug($rows, $disciplines);

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $institutionId = $institutions[$row['institution_abbreviation']] ?? null;
                $institutionCourseId = $courses[$institutionId.'|'.$row['course_code']] ?? null;
                $disciplineId = $disciplines[$row['discipline_slug']] ?? null;
                $canonicalTopicId = $topics[$disciplineId.'|'.$row['topic_slug']] ?? null;

                CourseTopicMapping::query()->updateOrCreate(
                    [
                        'institution_course_id' => $institutionCourseId,
                        'canonical_topic_id' => $canonicalTopicId,
                    ],
                    [
                        'sequence_order' => (int) $row['sequence_order'],
                        'weight' => $row['weight'],
                    ]
                );

                $successCount++;
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Row {$rowNumber}: {$e->getMessage()}";
            }
        }

        return new ImportResult(
            success: $errorCount === 0,
            totalRows: count($rows),
            successCount: $successCount,
            errorCount: $errorCount,
            errors: $errors,
        );
    }

    /** @param array<int, array<string, string>> $rows */
    public function importCourseOfferings(array $rows, ImportLog $log): ImportResult
    {
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        $institutions = $this->fetchInstitutionsByAbbreviation($rows);
        $courses = $this->fetchCoursesByInstitutionAndCode($rows, $institutions);
        $departments = $this->fetchDepartmentsByInstitutionAndAbbreviation($rows, $institutions);

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $institutionId = $institutions[$row['institution_abbreviation']] ?? null;
                $institutionCourseId = $courses[$institutionId.'|'.$row['course_code']] ?? null;
                $departmentId = $departments[$institutionId.'|'.$row['department_abbreviation']] ?? null;

                CourseDepartmentOffering::query()->updateOrCreate(
                    [
                        'institution_course_id' => $institutionCourseId,
                        'department_id' => $departmentId,
                    ],
                    [
                        'is_compulsory' => strtolower($row['is_compulsory']) === 'true',
                    ]
                );

                $successCount++;
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Row {$rowNumber}: {$e->getMessage()}";
            }
        }

        return new ImportResult(
            success: $errorCount === 0,
            totalRows: count($rows),
            successCount: $successCount,
            errorCount: $errorCount,
            errors: $errors,
        );
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<int, string>
     */
    private function validateTopicRows(array $rows): array
    {
        $errors = [];
        $required = ['discipline_slug', 'title', 'difficulty_level', 'content_markdown'];
        $validDifficulties = TopicDifficulty::values();

        $disciplineSlugs = collect($rows)->pluck('discipline_slug')->filter()->unique()->values()->all();
        $disciplines = Discipline::query()->whereIn('slug', $disciplineSlugs)->pluck('id', 'slug')->all();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['discipline_slug']) && ! isset($disciplines[$row['discipline_slug']])) {
                $errors[] = "Row {$rowNumber}: Discipline '{$row['discipline_slug']}' not found.";
            }

            if (! empty($row['difficulty_level']) && ! in_array($row['difficulty_level'], $validDifficulties, true)) {
                $errors[] = "Row {$rowNumber}: Invalid difficulty_level '{$row['difficulty_level']}'.";
            }
        }

        return $errors;
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<int, string>
     */
    private function validateCourseMappingRows(array $rows): array
    {
        $errors = [];
        $required = ['institution_abbreviation', 'course_code', 'discipline_slug', 'topic_slug', 'sequence_order', 'weight'];
        $validWeights = TopicWeight::values();

        $institutions = $this->fetchInstitutionsByAbbreviation($rows);
        $disciplines = $this->fetchDisciplinesBySlug($rows);
        $courses = $this->fetchCoursesByInstitutionAndCode($rows, $institutions);
        $topics = $this->fetchTopicsByDisciplineAndSlug($rows, $disciplines);

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['institution_abbreviation'])) {
                $institutionId = $institutions[$row['institution_abbreviation']] ?? null;
                if (! $institutionId) {
                    $errors[] = "Row {$rowNumber}: Institution '{$row['institution_abbreviation']}' not found.";
                } elseif (! empty($row['course_code'])) {
                    if (! isset($courses[$institutionId.'|'.$row['course_code']])) {
                        $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' not found at institution '{$row['institution_abbreviation']}'.";
                    }
                }
            }

            if (! empty($row['discipline_slug'])) {
                $disciplineId = $disciplines[$row['discipline_slug']] ?? null;
                if (! $disciplineId) {
                    $errors[] = "Row {$rowNumber}: Discipline '{$row['discipline_slug']}' not found.";
                } elseif (! empty($row['topic_slug'])) {
                    if (! isset($topics[$disciplineId.'|'.$row['topic_slug']])) {
                        $errors[] = "Row {$rowNumber}: Topic '{$row['topic_slug']}' not found in discipline '{$row['discipline_slug']}'.";
                    }
                }
            }

            if (! empty($row['sequence_order']) && (! ctype_digit($row['sequence_order']) || (int) $row['sequence_order'] < 1)) {
                $errors[] = "Row {$rowNumber}: sequence_order must be a positive integer.";
            }

            if (! empty($row['weight']) && ! in_array($row['weight'], $validWeights, true)) {
                $errors[] = "Row {$rowNumber}: Invalid weight '{$row['weight']}'.";
            }
        }

        return $errors;
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<int, string>
     */
    private function validateCourseOfferingRows(array $rows): array
    {
        $errors = [];
        $required = ['institution_abbreviation', 'course_code', 'department_abbreviation', 'is_compulsory'];

        $institutions = $this->fetchInstitutionsByAbbreviation($rows);
        $coursesWithScope = $this->fetchCoursesWithScopeByInstitutionAndCode($rows, $institutions);
        $departments = $this->fetchDepartmentsByInstitutionAndAbbreviation($rows, $institutions);

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['institution_abbreviation'])) {
                $institutionId = $institutions[$row['institution_abbreviation']] ?? null;
                if (! $institutionId) {
                    $errors[] = "Row {$rowNumber}: Institution '{$row['institution_abbreviation']}' not found.";
                } else {
                    if (! empty($row['course_code'])) {
                        $course = $coursesWithScope[$institutionId.'|'.$row['course_code']] ?? null;
                        if (! $course) {
                            $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' not found at institution '{$row['institution_abbreviation']}'.";
                        } elseif ($course->course_scope !== CourseScope::Faculty) {
                            $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' scope must be 'faculty' for department offerings.";
                        }
                    }

                    if (! empty($row['department_abbreviation'])) {
                        if (! isset($departments[$institutionId.'|'.$row['department_abbreviation']])) {
                            $errors[] = "Row {$rowNumber}: Department '{$row['department_abbreviation']}' not found at institution '{$row['institution_abbreviation']}'.";
                        }
                    }
                }
            }

            if (! empty($row['is_compulsory']) && ! in_array(strtolower($row['is_compulsory']), ['true', 'false'], true)) {
                $errors[] = "Row {$rowNumber}: is_compulsory must be 'true' or 'false'.";
            }
        }

        return $errors;
    }

    /** @param array<int, array<string, string>> $rows */
    public function importQuestions(array $rows, ImportLog $log, string $defaultStatus = 'draft'): ImportResult
    {
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        $status = $defaultStatus === 'published' ? QuestionStatus::Published : QuestionStatus::Draft;

        $institutions = $this->fetchInstitutionsByAbbreviation($rows);
        $courses = $this->fetchCoursesByInstitutionAndCode($rows, $institutions);

        $topicSlugs = collect($rows)->pluck('topic_slug')->filter()->unique()->values()->all();
        $topics = CanonicalTopic::query()
            ->whereIn('slug', $topicSlugs)
            ->where('is_published', true)
            ->pluck('id', 'slug')
            ->all();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $institutionId = $institutions[$row['institution_abbreviation']] ?? null;
                $institutionCourseId = $courses[$institutionId.'|'.$row['course_code']] ?? null;
                $topicId = $topics[$row['topic_slug']] ?? null;

                $question = Question::query()->create([
                    'institution_course_id' => $institutionCourseId,
                    'question_type' => $row['question_type'],
                    'content' => $row['content'],
                    'year' => ! empty($row['year']) ? (int) $row['year'] : null,
                    'semester' => ! empty($row['semester']) ? $row['semester'] : null,
                    'difficulty_level' => ! empty($row['difficulty_level']) ? $row['difficulty_level'] : null,
                    'source' => QuestionSource::BulkImport,
                    'status' => $status,
                    'created_by' => $log->processed_by,
                    'published_at' => $status === QuestionStatus::Published ? now() : null,
                ]);

                if ($row['question_type'] === 'mcq') {
                    $question->update(['response_config' => $this->buildMcqResponseConfig($row)]);
                }

                QuestionTopicLink::query()->create([
                    'question_id' => $question->id,
                    'canonical_topic_id' => $topicId,
                    'is_primary' => true,
                ]);

                if (! empty($row['quick_answer'])) {
                    QuestionAnswer::query()->create([
                        'question_id' => $question->id,
                        'depth_level' => AnswerDepthLevel::Quick,
                        'content' => $this->markdownToTiptap($row['quick_answer']),
                        'content_plain' => strip_tags($row['quick_answer']),
                        'is_published' => $status === QuestionStatus::Published,
                        'created_by' => $log->processed_by,
                    ]);
                }

                if (! empty($row['standard_answer'])) {
                    QuestionAnswer::query()->create([
                        'question_id' => $question->id,
                        'depth_level' => AnswerDepthLevel::Standard,
                        'content' => $this->markdownToTiptap($row['standard_answer']),
                        'content_plain' => strip_tags($row['standard_answer']),
                        'is_published' => $status === QuestionStatus::Published,
                        'created_by' => $log->processed_by,
                    ]);
                }

                $successCount++;
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Row {$rowNumber}: {$e->getMessage()}";
            }
        }

        return new ImportResult(
            success: $errorCount === 0,
            totalRows: count($rows),
            successCount: $successCount,
            errorCount: $errorCount,
            errors: $errors,
        );
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<int, string>
     */
    private function validateQuestionRows(array $rows): array
    {
        $errors = [];
        $required = ['institution_abbreviation', 'course_code', 'question_type', 'content', 'topic_slug'];
        $validTypes = QuestionType::values();
        $validDifficulties = QuestionDifficulty::values();
        $validSemesters = ['first', 'second'];

        $institutions = $this->fetchInstitutionsByAbbreviation($rows);
        $courses = $this->fetchCoursesByInstitutionAndCode($rows, $institutions);

        $topicSlugs = collect($rows)->pluck('topic_slug')->filter()->unique()->values()->all();
        $topics = CanonicalTopic::query()
            ->whereIn('slug', $topicSlugs)
            ->where('is_published', true)
            ->pluck('id', 'slug')
            ->all();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['institution_abbreviation'])) {
                $institutionId = $institutions[$row['institution_abbreviation']] ?? null;
                if (! $institutionId) {
                    $errors[] = "Row {$rowNumber}: Institution '{$row['institution_abbreviation']}' not found.";
                } elseif (! empty($row['course_code'])) {
                    if (! isset($courses[$institutionId.'|'.$row['course_code']])) {
                        $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' not found at institution '{$row['institution_abbreviation']}'.";
                    }
                }
            }

            if (! empty($row['topic_slug']) && ! isset($topics[$row['topic_slug']])) {
                $errors[] = "Row {$rowNumber}: Topic '{$row['topic_slug']}' not found or not published.";
            }

            if (! empty($row['question_type']) && ! in_array($row['question_type'], $validTypes, true)) {
                $errors[] = "Row {$rowNumber}: Invalid question_type '{$row['question_type']}'. Valid types: ".implode(', ', $validTypes).'.';
            }

            if (! empty($row['difficulty_level']) && ! in_array($row['difficulty_level'], $validDifficulties, true)) {
                $errors[] = "Row {$rowNumber}: Invalid difficulty_level '{$row['difficulty_level']}'.";
            }

            if (! empty($row['semester']) && ! in_array(strtolower($row['semester']), $validSemesters, true)) {
                $errors[] = "Row {$rowNumber}: Invalid semester '{$row['semester']}'. Must be 'first' or 'second'.";
            }

            if (($row['question_type'] ?? '') === 'mcq') {
                if (empty($row['option_a'] ?? '') || empty($row['option_b'] ?? '')) {
                    $errors[] = "Row {$rowNumber}: MCQ questions require at least option_a and option_b.";
                }

                $correctOption = strtoupper($row['correct_option'] ?? '');
                if (empty($correctOption)) {
                    $errors[] = "Row {$rowNumber}: MCQ questions require a correct_option (A-E).";
                } elseif (! in_array($correctOption, ['A', 'B', 'C', 'D', 'E'], true)) {
                    $errors[] = "Row {$rowNumber}: Invalid correct_option '{$row['correct_option']}'. Must be A-E.";
                } else {
                    $optionColumns = ['A' => 'option_a', 'B' => 'option_b', 'C' => 'option_c', 'D' => 'option_d', 'E' => 'option_e'];
                    $correctColumn = $optionColumns[$correctOption];
                    if (empty($row[$correctColumn] ?? '')) {
                        $errors[] = "Row {$rowNumber}: correct_option is '{$correctOption}' but '{$correctColumn}' is empty.";
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<string, string>
     */
    private function fetchInstitutionsByAbbreviation(array $rows): array
    {
        $abbreviations = collect($rows)->pluck('institution_abbreviation')->filter()->unique()->values()->all();

        return Institution::query()
            ->whereIn('abbreviation', $abbreviations)
            ->pluck('id', 'abbreviation')
            ->all();
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     * @return array<string, string>
     */
    private function fetchDisciplinesBySlug(array $rows): array
    {
        $slugs = collect($rows)->pluck('discipline_slug')->filter()->unique()->values()->all();

        return Discipline::query()
            ->whereIn('slug', $slugs)
            ->pluck('id', 'slug')
            ->all();
    }

    /**
     * Keyed as "{institution_id}|{course_code}" => course_id.
     *
     * @param  array<int, array<string, string>>  $rows
     * @param  array<string, string>  $institutions  abbreviation => id
     * @return array<string, string>
     */
    private function fetchCoursesByInstitutionAndCode(array $rows, array $institutions): array
    {
        $institutionIds = array_values($institutions);
        $courseCodes = collect($rows)->pluck('course_code')->filter()->unique()->values()->all();

        return InstitutionCourse::query()
            ->whereIn('institution_id', $institutionIds)
            ->whereIn('course_code', $courseCodes)
            ->get(['id', 'institution_id', 'course_code'])
            ->keyBy(fn ($c) => $c->institution_id.'|'.$c->course_code)
            ->map(fn ($c) => $c->id)
            ->all();
    }

    /**
     * Keyed as "{institution_id}|{course_code}" => InstitutionCourse model (with course_scope).
     * Used when the course_scope value is needed for validation.
     *
     * @param  array<int, array<string, string>>  $rows
     * @param  array<string, string>  $institutions  abbreviation => id
     * @return array<string, InstitutionCourse>
     */
    private function fetchCoursesWithScopeByInstitutionAndCode(array $rows, array $institutions): array
    {
        $institutionIds = array_values($institutions);
        $courseCodes = collect($rows)->pluck('course_code')->filter()->unique()->values()->all();

        return InstitutionCourse::query()
            ->whereIn('institution_id', $institutionIds)
            ->whereIn('course_code', $courseCodes)
            ->get(['id', 'institution_id', 'course_code', 'course_scope'])
            ->keyBy(fn ($c) => $c->institution_id.'|'.$c->course_code)
            ->all();
    }

    /**
     * Keyed as "{institution_id}|{topic_slug}" => topic_id.
     *
     * @param  array<int, array<string, string>>  $rows
     * @param  array<string, string>  $disciplines  slug => id
     * @return array<string, string>
     */
    private function fetchTopicsByDisciplineAndSlug(array $rows, array $disciplines): array
    {
        $disciplineIds = array_values($disciplines);
        $topicSlugs = collect($rows)->pluck('topic_slug')->filter()->unique()->values()->all();

        return CanonicalTopic::query()
            ->whereIn('discipline_id', $disciplineIds)
            ->whereIn('slug', $topicSlugs)
            ->where('is_published', true)
            ->get(['id', 'discipline_id', 'slug'])
            ->keyBy(fn ($t) => $t->discipline_id.'|'.$t->slug)
            ->map(fn ($t) => $t->id)
            ->all();
    }

    /**
     * Keyed as "{institution_id}|{department_abbreviation}" => department_id.
     *
     * @param  array<int, array<string, string>>  $rows
     * @param  array<string, string>  $institutions  abbreviation => id
     * @return array<string, string>
     */
    private function fetchDepartmentsByInstitutionAndAbbreviation(array $rows, array $institutions): array
    {
        $institutionIds = array_values($institutions);
        $departmentAbbreviations = collect($rows)->pluck('department_abbreviation')->filter()->unique()->values()->all();

        return Department::query()
            ->whereIn('abbreviation', $departmentAbbreviations)
            ->whereHas('faculty', fn ($q) => $q->whereIn('institution_id', $institutionIds))
            ->with('faculty:id,institution_id')
            ->get(['id', 'abbreviation', 'faculty_id'])
            ->keyBy(fn ($d) => $d->faculty->institution_id.'|'.$d->abbreviation)
            ->map(fn ($d) => $d->id)
            ->all();
    }

    /**
     * @param  array<string, string>  $row
     * @return array{options: array<int, array{label: string, text: string, is_correct: bool}>}
     */
    private function buildMcqResponseConfig(array $row): array
    {
        $labels = ['A', 'B', 'C', 'D', 'E'];
        $columns = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'];
        $correctOption = strtoupper($row['correct_option'] ?? '');
        $options = [];

        foreach ($labels as $i => $label) {
            $column = $columns[$i];
            if (empty($row[$column] ?? '')) {
                continue;
            }

            $options[] = [
                'label' => $label,
                'text' => $row[$column],
                'is_correct' => $label === $correctOption,
            ];
        }

        return ['options' => $options];
    }

    /** @return array<string, mixed> */
    private function markdownToTiptap(string $markdown): array
    {
        return [
            'type' => 'doc',
            'content' => [
                [
                    'type' => 'paragraph',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => $markdown,
                        ],
                    ],
                ],
            ],
        ];
    }
}
