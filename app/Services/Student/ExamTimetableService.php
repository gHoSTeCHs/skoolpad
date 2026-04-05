<?php

namespace App\Services\Student;

use App\Models\ExamGoal;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Models\User;

class ExamTimetableService
{
    public function validateOwnership(StudentProfile $profile, array $validated): void
    {
        if (! empty($validated['institution_course_id'])) {
            $enrolledCourseIds = $profile->studentCourses()
                ->where('is_archived', false)
                ->pluck('institution_course_id');

            if (! $enrolledCourseIds->contains($validated['institution_course_id'])) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        if (! empty($validated['level_subject_id'])) {
            $levelSubject = LevelSubject::query()->findOrFail($validated['level_subject_id']);

            if ($levelSubject->education_level_id !== $profile->education_level_id) {
                abort(403, 'This subject is not available for your education level.');
            }

            if ($profile->stream_id && $levelSubject->stream_id && $levelSubject->stream_id !== $profile->stream_id) {
                abort(403, 'This subject is not available for your stream.');
            }
        }
    }

    public function validateAocTopics(array $validated): void
    {
        if (empty($validated['aoc_topic_ids'])) {
            return;
        }

        $validTopicIds = collect();

        if (! empty($validated['institution_course_id'])) {
            $validTopicIds = InstitutionCourse::query()->findOrFail($validated['institution_course_id'])
                ->topics()
                ->pluck('canonical_topics.id');
        } elseif (! empty($validated['level_subject_id'])) {
            $validTopicIds = SchemeOfWorkItem::query()
                ->where('curriculum_subject_level_id', $validated['level_subject_id'])
                ->whereNotNull('canonical_topic_id')
                ->pluck('canonical_topic_id');
        }

        $invalidTopics = collect($validated['aoc_topic_ids'])->diff($validTopicIds);
        if ($invalidTopics->isNotEmpty()) {
            abort(422, 'Some AOC topics do not belong to the selected course or subject.');
        }
    }

    public function migrateExamGoals(User $user, StudentProfile $profile): void
    {
        $goals = ExamGoal::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereNotNull('exam_date')
            ->whereNotNull('institution_course_id')
            ->with(['assessmentType:id,name', 'institutionCourse:id,course_title'])
            ->get();

        foreach ($goals as $goal) {
            $exists = $user->examTimetableEntries()
                ->where('institution_course_id', $goal->institution_course_id)
                ->where('exam_date', $goal->exam_date)
                ->exists();

            if ($exists) {
                continue;
            }

            $label = ($goal->institutionCourse?->course_title ?? 'Exam')
                .($goal->assessmentType ? ' — '.$goal->assessmentType->name : '');

            $user->examTimetableEntries()->create([
                'institution_course_id' => $goal->institution_course_id,
                'assessment_type_id' => $goal->assessment_type_id,
                'label' => $label,
                'exam_date' => $goal->exam_date,
            ]);
        }

        $profile->update([
            'study_preferences' => array_merge(
                $profile->study_preferences ?? [],
                ['exam_goals_migrated' => true]
            ),
        ]);
    }
}
