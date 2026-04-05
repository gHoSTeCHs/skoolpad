<?php

namespace App\Services\Admin;

use App\Models\CourseBlockMapping;
use App\Models\CourseDepartmentOffering;
use App\Models\CourseTopicMapping;
use App\Models\Department;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use Illuminate\Support\Str;

class CourseMappingService
{
    public function findOrCreateLevelSubject(array $validated): LevelSubject
    {
        return LevelSubject::query()->firstOrCreate(
            [
                'education_level_id' => $validated['education_level_id'],
                'curriculum_subject_id' => $validated['curriculum_subject_id'],
                'stream_id' => $validated['stream_id'] ?? null,
            ],
            ['is_compulsory' => true]
        );
    }

    /** @param array<int, array{canonical_topic_id: string, sequence_order: int, weight: string}> $mappings */
    public function saveTopicMappings(InstitutionCourse $course, array $mappings): void
    {
        $course->topicMappings()->delete();

        $rows = $this->buildInsertRows($mappings, fn (array $mapping) => [
            'institution_course_id' => $course->id,
            'canonical_topic_id' => $mapping['canonical_topic_id'],
            'sequence_order' => $mapping['sequence_order'],
            'weight' => $mapping['weight'],
        ]);

        if (! empty($rows)) {
            CourseTopicMapping::query()->insert($rows);
        }
    }

    /** @param array<int, array<string, mixed>> $mappings */
    public function saveCourseBlockMappings(InstitutionCourse $course, array $mappings): void
    {
        $course->courseBlockMappings()->delete();

        $rows = $this->buildInsertRows($mappings, fn (array $m) => [
            'institution_course_id' => $course->id,
            'curriculum_subject_level_id' => null,
            'content_block_id' => $m['content_block_id'],
            'teaching_depth' => $m['teaching_depth'],
            'is_core_block' => $m['is_core_block'],
            'week_start' => $m['week_start'] ?? null,
            'week_end' => $m['week_end'] ?? null,
            'lecture_hours' => $m['lecture_hours'] ?? null,
            'lab_hours' => $m['lab_hours'] ?? null,
        ]);

        if (! empty($rows)) {
            CourseBlockMapping::query()->insert($rows);
        }
    }

    /** @param array<int, array<string, mixed>> $mappings */
    public function saveCurriculumBlockMappings(string $levelSubjectId, array $mappings): void
    {
        CourseBlockMapping::query()->where('curriculum_subject_level_id', $levelSubjectId)->delete();

        $rows = $this->buildInsertRows($mappings, fn (array $m) => [
            'institution_course_id' => null,
            'curriculum_subject_level_id' => $levelSubjectId,
            'content_block_id' => $m['content_block_id'],
            'teaching_depth' => $m['teaching_depth'],
            'is_core_block' => $m['is_core_block'],
            'week_start' => null,
            'week_end' => null,
            'lecture_hours' => null,
            'lab_hours' => null,
        ]);

        if (! empty($rows)) {
            CourseBlockMapping::query()->insert($rows);
        }
    }

    /** @param array<int, array<string, mixed>> $items */
    public function saveSchemeOfWork(string $levelSubjectId, int $term, array $items): void
    {
        SchemeOfWorkItem::query()
            ->where('curriculum_subject_level_id', $levelSubjectId)
            ->where('term', $term)
            ->delete();

        $rows = $this->buildInsertRows($items, fn (array $item) => [
            'curriculum_subject_level_id' => $levelSubjectId,
            'term' => $term,
            'week_number' => $item['week_number'],
            'topic_label' => $item['topic_label'],
            'canonical_topic_id' => $item['canonical_topic_id'] ?? null,
            'content_block_id' => $item['content_block_id'] ?? null,
        ]);

        if (! empty($rows)) {
            SchemeOfWorkItem::query()->insert($rows);
        }
    }

    /** @param array<int, array{department_id: string, is_compulsory: bool}> $offerings */
    public function saveDepartmentOfferings(InstitutionCourse $course, array $offerings): void
    {
        $departmentIds = collect($offerings)->pluck('department_id');

        $validDepartmentIds = Department::query()->whereIn('id', $departmentIds)
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $course->institution_id))
            ->pluck('id');

        CourseDepartmentOffering::query()->where('institution_course_id', $course->id)
            ->whereNotIn('department_id', $validDepartmentIds)
            ->delete();

        foreach ($offerings as $offering) {
            if ($validDepartmentIds->contains($offering['department_id'])) {
                CourseDepartmentOffering::query()->updateOrCreate(
                    [
                        'institution_course_id' => $course->id,
                        'department_id' => $offering['department_id'],
                    ],
                    [
                        'is_compulsory' => $offering['is_compulsory'],
                    ]
                );
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function buildInsertRows(array $items, callable $mapper): array
    {
        $now = now();

        return collect($items)->map(fn (array $item) => array_merge(
            ['id' => Str::uuid()->toString()],
            $mapper($item),
            ['created_at' => $now, 'updated_at' => $now],
        ))->all();
    }
}
