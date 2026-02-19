<?php

namespace App\Services;

use App\DataTransferObjects\ImportResult;
use App\DataTransferObjects\ValidationResult;
use App\Enums\CourseScope;
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
use Illuminate\Support\Str;

class ContentImportService
{
    /** @param array<int, array<string, string>> $rows */
    public function validateCsv(array $rows, string $importType): ValidationResult
    {
        $errors = match ($importType) {
            'topics' => $this->validateTopicRows($rows),
            'course_mappings' => $this->validateCourseMappingRows($rows),
            'course_offerings' => $this->validateCourseOfferingRows($rows),
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $disciplineId = Discipline::where('slug', $row['discipline_slug'])->value('id');

                CanonicalTopic::updateOrCreate(
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $institutionId = Institution::where('abbreviation', $row['institution_abbreviation'])->value('id');
                $institutionCourseId = InstitutionCourse::where('institution_id', $institutionId)
                    ->where('course_code', $row['course_code'])
                    ->value('id');
                $disciplineId = Discipline::where('slug', $row['discipline_slug'])->value('id');
                $canonicalTopicId = CanonicalTopic::where('discipline_id', $disciplineId)
                    ->where('slug', $row['topic_slug'])
                    ->where('is_published', true)
                    ->value('id');

                CourseTopicMapping::updateOrCreate(
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            try {
                $institutionId = Institution::where('abbreviation', $row['institution_abbreviation'])->value('id');
                $institutionCourseId = InstitutionCourse::where('institution_id', $institutionId)
                    ->where('course_code', $row['course_code'])
                    ->value('id');
                $departmentId = Department::where('abbreviation', $row['department_abbreviation'])
                    ->whereHas('faculty', fn ($q) => $q->where('institution_id', $institutionId))
                    ->value('id');

                CourseDepartmentOffering::updateOrCreate(
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['discipline_slug']) && ! Discipline::where('slug', $row['discipline_slug'])->value('id')) {
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['institution_abbreviation'])) {
                $institutionId = Institution::where('abbreviation', $row['institution_abbreviation'])->value('id');
                if (! $institutionId) {
                    $errors[] = "Row {$rowNumber}: Institution '{$row['institution_abbreviation']}' not found.";
                } elseif (! empty($row['course_code'])) {
                    $courseId = InstitutionCourse::where('institution_id', $institutionId)
                        ->where('course_code', $row['course_code'])
                        ->value('id');
                    if (! $courseId) {
                        $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' not found at institution '{$row['institution_abbreviation']}'.";
                    }
                }
            }

            if (! empty($row['discipline_slug'])) {
                $disciplineId = Discipline::where('slug', $row['discipline_slug'])->value('id');
                if (! $disciplineId) {
                    $errors[] = "Row {$rowNumber}: Discipline '{$row['discipline_slug']}' not found.";
                } elseif (! empty($row['topic_slug'])) {
                    $topicId = CanonicalTopic::where('discipline_id', $disciplineId)
                        ->where('slug', $row['topic_slug'])
                        ->where('is_published', true)
                        ->value('id');
                    if (! $topicId) {
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

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            foreach ($required as $column) {
                if (empty($row[$column] ?? '')) {
                    $errors[] = "Row {$rowNumber}: Missing required column '{$column}'.";
                }
            }

            if (! empty($row['institution_abbreviation'])) {
                $institutionId = Institution::where('abbreviation', $row['institution_abbreviation'])->value('id');
                if (! $institutionId) {
                    $errors[] = "Row {$rowNumber}: Institution '{$row['institution_abbreviation']}' not found.";
                } else {
                    if (! empty($row['course_code'])) {
                        $course = InstitutionCourse::where('institution_id', $institutionId)
                            ->where('course_code', $row['course_code'])
                            ->first(['id', 'course_scope']);
                        if (! $course) {
                            $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' not found at institution '{$row['institution_abbreviation']}'.";
                        } elseif ($course->course_scope !== CourseScope::Faculty) {
                            $errors[] = "Row {$rowNumber}: Course '{$row['course_code']}' scope must be 'faculty' for department offerings.";
                        }
                    }

                    if (! empty($row['department_abbreviation'])) {
                        $departmentId = Department::where('abbreviation', $row['department_abbreviation'])
                            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $institutionId))
                            ->value('id');
                        if (! $departmentId) {
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
