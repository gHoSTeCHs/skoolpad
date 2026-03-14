<?php

namespace App\Services;

use App\Models\GradingScale;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;

class CgpaSimulatorService
{
    public function getGradingScale(User $user): ?GradingScale
    {
        $profile = $user->studentProfile;

        if (! $profile || ! $profile->isTertiary() || ! $profile->institution_id) {
            return null;
        }

        $profile->load([
            'institution.gradingScale',
            'institution.institutionTypeModel.gradingScale',
        ]);

        return $profile->institution?->gradingScale
            ?? $profile->institution?->institutionTypeModel?->gradingScale;
    }

    public function gradeToPoint(string $grade, GradingScale $scale): ?float
    {
        $boundaries = $scale->grade_boundaries ?? [];

        foreach ($boundaries as $boundary) {
            if (strcasecmp($boundary['label'], $grade) === 0) {
                return (float) ($boundary['gp'] ?? $boundary['points'] ?? 0);
            }
        }

        return null;
    }

    /**
     * @param  array<int, array{credit_units: int, grade: string}>  $courses
     * @return array{gpa: float, total_credits: int, total_quality_points: float}
     */
    public function calculateGpa(array $courses, GradingScale $scale): array
    {
        $totalCredits = 0;
        $totalQualityPoints = 0.0;

        foreach ($courses as $course) {
            $credits = (int) $course['credit_units'];
            $point = $this->gradeToPoint($course['grade'], $scale);

            if ($point === null) {
                continue;
            }

            $totalCredits += $credits;
            $totalQualityPoints += $credits * $point;
        }

        $gpa = $totalCredits > 0
            ? round($totalQualityPoints / $totalCredits, 2)
            : 0.0;

        return [
            'gpa' => $gpa,
            'total_credits' => $totalCredits,
            'total_quality_points' => round($totalQualityPoints, 2),
        ];
    }

    /**
     * @param  array<int, array{credit_units: int, grade: string}>  $projectedCourses
     * @return array{projected_cgpa: float, classification: string|null, new_credits: int, new_quality_points: float}
     */
    public function calculateProjectedCgpa(
        float $currentCgpa,
        int $currentCredits,
        array $projectedCourses,
        GradingScale $scale,
    ): array {
        $result = $this->calculateGpa($projectedCourses, $scale);

        $oldQualityPoints = $currentCgpa * $currentCredits;
        $totalCredits = $currentCredits + $result['total_credits'];

        $projectedCgpa = $totalCredits > 0
            ? round(($oldQualityPoints + $result['total_quality_points']) / $totalCredits, 2)
            : 0.0;

        $scaleMax = (float) ($scale->scale_max ?? 5);
        $projectedCgpa = min($projectedCgpa, $scaleMax);

        return [
            'projected_cgpa' => $projectedCgpa,
            'classification' => $this->classifyCgpa($projectedCgpa, $scale),
            'new_credits' => $result['total_credits'],
            'new_quality_points' => $result['total_quality_points'],
        ];
    }

    /**
     * @return array{required_gpa: float, is_achievable: bool, minimum_grade: string|null, message: string}
     */
    public function calculateRequiredGpa(
        float $currentCgpa,
        int $currentCredits,
        float $targetCgpa,
        int $remainingCredits,
        GradingScale $scale,
    ): array {
        $scaleMax = (float) ($scale->scale_max ?? 5);

        if ($remainingCredits <= 0) {
            return [
                'required_gpa' => 0.0,
                'is_achievable' => $currentCgpa >= $targetCgpa,
                'minimum_grade' => null,
                'message' => $currentCgpa >= $targetCgpa
                    ? 'You have already met your target CGPA.'
                    : 'No remaining credits to improve your CGPA.',
            ];
        }

        $totalCredits = $currentCredits + $remainingCredits;
        $requiredQualityPoints = ($targetCgpa * $totalCredits) - ($currentCgpa * $currentCredits);
        $requiredGpa = round($requiredQualityPoints / $remainingCredits, 2);

        if ($requiredGpa < 0) {
            return [
                'required_gpa' => 0.0,
                'is_achievable' => true,
                'minimum_grade' => null,
                'message' => 'You have already exceeded your target CGPA.',
            ];
        }

        $isAchievable = $requiredGpa <= $scaleMax;

        $minimumGrade = null;
        if ($isAchievable) {
            $boundaries = $scale->grade_boundaries ?? [];
            usort($boundaries, fn ($a, $b) => ($a['gp'] ?? $a['points'] ?? 0) <=> ($b['gp'] ?? $b['points'] ?? 0));

            foreach ($boundaries as $boundary) {
                $gp = (float) ($boundary['gp'] ?? $boundary['points'] ?? 0);
                if ($gp >= $requiredGpa) {
                    $minimumGrade = $boundary['label'];
                    break;
                }
            }
        }

        if (! $isAchievable) {
            $message = sprintf(
                'A GPA of %.2f is required, which exceeds the maximum of %.1f. Consider adjusting your target.',
                $requiredGpa,
                $scaleMax,
            );
        } else {
            $message = sprintf(
                'You need a minimum GPA of %.2f across your remaining %d credits.',
                $requiredGpa,
                $remainingCredits,
            );
        }

        return [
            'required_gpa' => max(0, $requiredGpa),
            'is_achievable' => $isAchievable,
            'minimum_grade' => $minimumGrade,
            'message' => $message,
        ];
    }

    public function classifyCgpa(float $cgpa, GradingScale $scale): ?string
    {
        $labels = $scale->classification_labels ?? [];

        if (empty($labels)) {
            return null;
        }

        usort($labels, fn ($a, $b) => $b['min_cgpa'] <=> $a['min_cgpa']);

        foreach ($labels as $label) {
            if ($cgpa >= $label['min_cgpa']) {
                return $label['label'];
            }
        }

        return null;
    }

    /**
     * @return Collection<int, array{id: string, course_code: string, course_title: string, credit_units: int, level: string|null, semester: string|null}>
     */
    public function getEnrolledCourses(StudentProfile $profile): Collection
    {
        return $profile->studentCourses()
            ->where('is_archived', false)
            ->with('institutionCourse:id,course_code,course_title,credit_units,level,semester')
            ->get()
            ->filter(fn ($sc) => $sc->institutionCourse !== null)
            ->map(fn ($sc) => [
                'id' => $sc->institutionCourse->id,
                'course_code' => $sc->institutionCourse->course_code,
                'course_title' => $sc->institutionCourse->course_title,
                'credit_units' => $sc->institutionCourse->credit_units,
                'level' => $sc->institutionCourse->level,
                'semester' => $sc->institutionCourse->semester,
            ])
            ->values();
    }

    public function getLevelProgression(User $user): array
    {
        $profile = $user->studentProfile;

        if (! $profile || ! $profile->isTertiary() || ! $profile->institution_id) {
            return [];
        }

        $profile->load('institution.institutionTypeModel');

        return $profile->institution?->institutionTypeModel?->level_progression ?? [];
    }
}
