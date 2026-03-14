import type { ClassificationLabel, GradeBoundary, ProjectedGradeEntry } from '@/types/cgpa';

export function gradeToPoint(grade: string, gradeBoundaries: GradeBoundary[]): number | null {
    const match = gradeBoundaries.find((b) => b.label.toLowerCase() === grade.toLowerCase());
    return match ? match.gp : null;
}

export function calculateGpa(
    courses: ProjectedGradeEntry[],
    gradeBoundaries: GradeBoundary[],
): { gpa: number; totalCredits: number; totalQualityPoints: number } {
    let totalCredits = 0;
    let totalQualityPoints = 0;

    for (const course of courses) {
        const point = gradeToPoint(course.grade, gradeBoundaries);
        if (point === null) continue;

        totalCredits += course.credit_units;
        totalQualityPoints += course.credit_units * point;
    }

    const gpa = totalCredits > 0 ? Math.round((totalQualityPoints / totalCredits) * 100) / 100 : 0;

    return { gpa, totalCredits, totalQualityPoints: Math.round(totalQualityPoints * 100) / 100 };
}

export function calculateProjectedCgpa(
    currentCgpa: number,
    currentCredits: number,
    courses: ProjectedGradeEntry[],
    gradeBoundaries: GradeBoundary[],
    scaleMax: number,
): { projectedCgpa: number; newCredits: number; newQualityPoints: number } {
    const { totalCredits, totalQualityPoints } = calculateGpa(courses, gradeBoundaries);

    const oldQualityPoints = currentCgpa * currentCredits;
    const combinedCredits = currentCredits + totalCredits;

    let projectedCgpa = combinedCredits > 0 ? (oldQualityPoints + totalQualityPoints) / combinedCredits : 0;

    projectedCgpa = Math.min(Math.round(projectedCgpa * 100) / 100, scaleMax);

    return { projectedCgpa, newCredits: totalCredits, newQualityPoints: totalQualityPoints };
}

export function calculateRequiredGpa(
    currentCgpa: number,
    currentCredits: number,
    targetCgpa: number,
    remainingCredits: number,
    scaleMax: number,
): { requiredGpa: number; isAchievable: boolean } {
    if (remainingCredits <= 0) {
        return { requiredGpa: 0, isAchievable: currentCgpa >= targetCgpa };
    }

    const totalCredits = currentCredits + remainingCredits;
    const requiredQualityPoints = targetCgpa * totalCredits - currentCgpa * currentCredits;
    const requiredGpa = Math.round((requiredQualityPoints / remainingCredits) * 100) / 100;

    if (requiredGpa < 0) {
        return { requiredGpa: 0, isAchievable: true };
    }

    return { requiredGpa, isAchievable: requiredGpa <= scaleMax };
}

export function classifyCgpa(cgpa: number, classificationLabels: ClassificationLabel[]): string | null {
    if (!classificationLabels || classificationLabels.length === 0) return null;

    const sorted = [...classificationLabels].sort((a, b) => b.min_cgpa - a.min_cgpa);

    for (const label of sorted) {
        if (cgpa >= label.min_cgpa) {
            return label.label;
        }
    }

    return null;
}
