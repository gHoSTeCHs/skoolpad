<?php

use App\Http\Controllers\Admin\AIModelController;
use App\Http\Controllers\Admin\AIPlatformSettingsController;
use App\Http\Controllers\Admin\AnswerController;
use App\Http\Controllers\Admin\AssessmentSubjectController;
use App\Http\Controllers\Admin\AssessmentTypeController;
use App\Http\Controllers\Admin\BulkImportController;
use App\Http\Controllers\Admin\CalendarTermController;
use App\Http\Controllers\Admin\CanonicalTopicController;
use App\Http\Controllers\Admin\ContentBlockController;
use App\Http\Controllers\Admin\ContentStudioController;
use App\Http\Controllers\Admin\CourseBlockMappingController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\CourseDepartmentController;
use App\Http\Controllers\Admin\CourseMappingController;
use App\Http\Controllers\Admin\CurriculumMappingController;
use App\Http\Controllers\Admin\CurriculumSubjectController;
use App\Http\Controllers\Admin\CurriculumTierController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\DisciplineController;
use App\Http\Controllers\Admin\EducationLevelController;
use App\Http\Controllers\Admin\EducationSystemController;
use App\Http\Controllers\Admin\ExamSubjectController;
use App\Http\Controllers\Admin\ExamTypeController;
use App\Http\Controllers\Admin\FacultyController;
use App\Http\Controllers\Admin\GradingScaleController;
use App\Http\Controllers\Admin\InstitutionController;
use App\Http\Controllers\Admin\InstitutionTypeController;
use App\Http\Controllers\Admin\QuestionContextController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\QuestionPaperController;
use App\Http\Controllers\Admin\QuestionSectionController;
use App\Http\Controllers\Admin\ReviewQueueController;
use App\Http\Controllers\Admin\SchemeOfWorkController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StreamController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use App\Http\Controllers\Admin\UserController;
use App\Models\CanonicalTopic;
use App\Models\Department;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('topics', [CanonicalTopicController::class, 'index'])->name('topics.index');
    Route::get('topics/create', [CanonicalTopicController::class, 'create'])->name('topics.create');
    Route::post('topics', [CanonicalTopicController::class, 'store'])->name('topics.store');
    Route::get('topics/{topic}/edit', [CanonicalTopicController::class, 'edit'])->name('topics.edit');
    Route::put('topics/{topic}', [CanonicalTopicController::class, 'update'])->name('topics.update');
    Route::get('topics/{topic}/preview', [CanonicalTopicController::class, 'preview'])->name('topics.preview');
    Route::post('topics/{topic}/toggle-publish', [CanonicalTopicController::class, 'togglePublish'])->name('topics.togglePublish');
    Route::get('question-papers', [QuestionPaperController::class, 'index'])->name('question-papers.index');
    Route::get('question-papers/create', [QuestionPaperController::class, 'create'])->name('question-papers.create');
    Route::post('question-papers', [QuestionPaperController::class, 'store'])->name('question-papers.store');
    Route::get('question-papers/{questionPaper}/build', [QuestionPaperController::class, 'build'])->name('question-papers.build');
    Route::put('question-papers/{questionPaper}', [QuestionPaperController::class, 'update'])->name('question-papers.update');
    Route::delete('question-papers/{questionPaper}', [QuestionPaperController::class, 'destroy'])->name('question-papers.destroy');

    Route::post('question-papers/{questionPaper}/sections', [QuestionSectionController::class, 'store'])->name('question-papers.sections.store');
    Route::put('question-papers/{questionPaper}/sections/{questionSection}', [QuestionSectionController::class, 'update'])->name('question-papers.sections.update');
    Route::delete('question-papers/{questionPaper}/sections/{questionSection}', [QuestionSectionController::class, 'destroy'])->name('question-papers.sections.destroy');
    Route::post('question-papers/{questionPaper}/sections/reorder', [QuestionSectionController::class, 'reorder'])->name('question-papers.sections.reorder');

    Route::post('question-papers/{questionPaper}/contexts', [QuestionContextController::class, 'store'])->name('question-papers.contexts.store');
    Route::put('question-papers/{questionPaper}/contexts/{questionContext}', [QuestionContextController::class, 'update'])->name('question-papers.contexts.update');
    Route::delete('question-papers/{questionPaper}/contexts/{questionContext}', [QuestionContextController::class, 'destroy'])->name('question-papers.contexts.destroy');
    Route::post('questions/{question}/contexts/link', [QuestionContextController::class, 'link'])->name('questions.contexts.link');
    Route::delete('questions/{question}/contexts/{questionContext}/unlink', [QuestionContextController::class, 'unlink'])->name('questions.contexts.unlink');

    Route::get('questions', [QuestionController::class, 'index'])->name('questions.index');
    Route::get('questions/create', [QuestionController::class, 'create'])->name('questions.create');
    Route::post('questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::get('questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');
    Route::put('questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
    Route::post('questions/reorder', [QuestionController::class, 'reorder'])->name('questions.reorder');
    Route::get('questions/{question}/answers', [AnswerController::class, 'index'])->name('questions.answers');
    Route::post('questions/{question}/answers', [AnswerController::class, 'store'])->name('questions.answers.store');
    Route::put('questions/{question}/answers/{answer}', [AnswerController::class, 'update'])->name('questions.answers.update');
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/create', [CourseController::class, 'create'])->name('courses.create');
    Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('courses/{course}/edit', [CourseController::class, 'edit'])->name('courses.edit');
    Route::put('courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::get('courses/{course}/departments', [CourseDepartmentController::class, 'index'])->name('courses.departments');
    Route::put('courses/{course}/departments', [CourseDepartmentController::class, 'update'])->name('courses.departments.update');
    Route::get('courses/{course}/mappings', [CourseMappingController::class, 'index'])->name('courses.mappings');
    Route::put('courses/{course}/mappings', [CourseMappingController::class, 'update'])->name('courses.mappings.update');
    Route::get('courses/{course}/block-mappings', [CourseBlockMappingController::class, 'index'])->name('course-block-mappings.index');
    Route::put('courses/{course}/block-mappings', [CourseBlockMappingController::class, 'update'])->name('course-block-mappings.update');

    Route::get('topics/{topic}/blocks', [ContentBlockController::class, 'index'])->name('content-blocks.index');
    Route::post('topics/{topic}/blocks', [ContentBlockController::class, 'store'])->name('content-blocks.store');
    Route::put('blocks/{block}', [ContentBlockController::class, 'update'])->name('content-blocks.update');
    Route::delete('blocks/{block}', [ContentBlockController::class, 'destroy'])->name('content-blocks.destroy');
    Route::put('topics/{topic}/blocks/reorder', [ContentBlockController::class, 'reorder'])->name('content-blocks.reorder');

    Route::get('curriculum-mappings', [CurriculumMappingController::class, 'index'])->name('curriculum-mappings.index');
    Route::post('curriculum-mappings/load', [CurriculumMappingController::class, 'load'])->name('curriculum-mappings.load');
    Route::put('curriculum-mappings', [CurriculumMappingController::class, 'update'])->name('curriculum-mappings.update');

    Route::get('scheme-of-work', [SchemeOfWorkController::class, 'index'])->name('scheme-of-work.index');
    Route::post('scheme-of-work/load', [SchemeOfWorkController::class, 'load'])->name('scheme-of-work.load');
    Route::put('scheme-of-work', [SchemeOfWorkController::class, 'update'])->name('scheme-of-work.update');

    Route::get('api/institutions/{institution}/structure', function (Institution $institution) {
        return response()->json([
            'faculties' => $institution->faculties()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::whereHas('faculty',
                fn ($q) => $q->where('institution_id', $institution->id))
                ->with('faculty:id,name')
                ->orderBy('name')
                ->get(['id', 'faculty_id', 'name', 'abbreviation']),
        ]);
    })->name('api.institution.structure');
    Route::get('api/topics/search', function (Request $request) {
        return CanonicalTopic::query()
            ->where('is_published', true)
            ->when($request->filled('q'), function ($q) use ($request) {
                $escaped = str_replace(['%', '_'], ['\%', '\_'], $request->string('q'));

                return $q->where('title', 'ilike', "%{$escaped}%");
            })
            ->orderBy('title')
            ->limit(20)
            ->get(['id', 'title']);
    })->name('api.topics.search');
    Route::get('api/institutions/{institution}/courses', function (Institution $institution, Request $request) {
        return InstitutionCourse::query()
            ->where('institution_id', $institution->id)
            ->when($request->filled('q'), function ($q) use ($request) {
                $escaped = str_replace(['%', '_'], ['\%', '\_'], $request->string('q'));

                return $q->where('course_code', 'ilike', "%{$escaped}%");
            })
            ->orderBy('course_code')
            ->limit(200)
            ->get(['id', 'course_code', 'course_title']);
    })->name('api.institution.courses');
    Route::get('review-queue', [ReviewQueueController::class, 'index'])->name('review-queue.index');
    Route::get('review-queue/uploads', [ReviewQueueController::class, 'uploads'])->name('review-queue.uploads');
    Route::post('review-queue/uploads/{submission}/transcribe', [ReviewQueueController::class, 'transcribe'])->name('review-queue.transcribe');
    Route::get('review-queue/{submission}', [ReviewQueueController::class, 'show'])->name('review-queue.show');
    Route::post('review-queue/{submission}/approve', [ReviewQueueController::class, 'approve'])->name('review-queue.approve');
    Route::post('review-queue/{submission}/reject', [ReviewQueueController::class, 'reject'])->name('review-queue.reject');
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::get('import', [BulkImportController::class, 'index'])->name('import.index');
    Route::post('import/topics', [BulkImportController::class, 'importTopics'])->name('import.topics')->middleware('throttle:10,1');
    Route::post('import/course-mappings', [BulkImportController::class, 'importCourseMappings'])->name('import.courseMappings')->middleware('throttle:10,1');
    Route::post('import/course-offerings', [BulkImportController::class, 'importCourseOfferings'])->name('import.courseOfferings')->middleware('throttle:10,1');
    Route::post('import/questions', [BulkImportController::class, 'importQuestions'])->name('import.questions')->middleware('throttle:10,1');
    Route::get('import/history', [BulkImportController::class, 'history'])->name('import.history');
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::get('settings/ai', [AIPlatformSettingsController::class, 'edit'])->name('settings.ai.edit');
    Route::put('settings/ai', [AIPlatformSettingsController::class, 'update'])->name('settings.ai.update');
    Route::get('settings/plans', [SubscriptionPlanController::class, 'index'])->name('settings.plans.index');
    Route::get('settings/plans/{plan}/edit', [SubscriptionPlanController::class, 'edit'])->name('settings.plans.edit');
    Route::put('settings/plans/{plan}', [SubscriptionPlanController::class, 'update'])->name('settings.plans.update');

    Route::resource('institutions', InstitutionController::class)->except(['destroy']);
    Route::post('institutions/{institution}/education-systems', [InstitutionController::class, 'attachEducationSystem'])->name('institutions.education-systems.attach');
    Route::delete('institutions/{institution}/education-systems/{education_system}', [InstitutionController::class, 'detachEducationSystem'])->name('institutions.education-systems.detach');
    Route::post('institutions/{institution}/calendar-terms', [CalendarTermController::class, 'store'])->name('calendar-terms.store');
    Route::put('calendar-terms/{calendar_term}', [CalendarTermController::class, 'update'])->name('calendar-terms.update');
    Route::delete('calendar-terms/{calendar_term}', [CalendarTermController::class, 'destroy'])->name('calendar-terms.destroy');
    Route::resource('disciplines', DisciplineController::class)->except(['show', 'destroy']);
    Route::resource('education-systems', EducationSystemController::class)->except(['destroy']);

    Route::post('education-systems/{education_system}/tiers', [CurriculumTierController::class, 'store'])->name('curriculum-tiers.store');
    Route::put('curriculum-tiers/{curriculum_tier}', [CurriculumTierController::class, 'update'])->name('curriculum-tiers.update');
    Route::delete('curriculum-tiers/{curriculum_tier}', [CurriculumTierController::class, 'destroy'])->name('curriculum-tiers.destroy');

    Route::post('curriculum-tiers/{curriculum_tier}/levels', [EducationLevelController::class, 'store'])->name('education-levels.store');
    Route::put('education-levels/{education_level}', [EducationLevelController::class, 'update'])->name('education-levels.update');
    Route::delete('education-levels/{education_level}', [EducationLevelController::class, 'destroy'])->name('education-levels.destroy');

    Route::post('education-systems/{education_system}/streams', [StreamController::class, 'store'])->name('streams.store');
    Route::put('streams/{stream}', [StreamController::class, 'update'])->name('streams.update');
    Route::delete('streams/{stream}', [StreamController::class, 'destroy'])->name('streams.destroy');

    Route::post('education-systems/{education_system}/subjects', [CurriculumSubjectController::class, 'store'])->name('curriculum-subjects.store');
    Route::put('curriculum-subjects/{curriculum_subject}', [CurriculumSubjectController::class, 'update'])->name('curriculum-subjects.update');
    Route::delete('curriculum-subjects/{curriculum_subject}', [CurriculumSubjectController::class, 'destroy'])->name('curriculum-subjects.destroy');

    Route::post('education-systems/{education_system}/assessments', [AssessmentTypeController::class, 'store'])->name('assessment-types.store');
    Route::put('assessment-types/{assessment_type}', [AssessmentTypeController::class, 'update'])->name('assessment-types.update');
    Route::delete('assessment-types/{assessment_type}', [AssessmentTypeController::class, 'destroy'])->name('assessment-types.destroy');

    Route::post('assessment-types/{assessment_type}/subjects', [AssessmentSubjectController::class, 'store'])->name('assessment-subjects.store');
    Route::put('assessment-subjects/{assessment_subject}', [AssessmentSubjectController::class, 'update'])->name('assessment-subjects.update');
    Route::delete('assessment-subjects/{assessment_subject}', [AssessmentSubjectController::class, 'destroy'])->name('assessment-subjects.destroy');

    Route::resource('institution-types', InstitutionTypeController::class)->except(['show', 'destroy']);

    Route::resource('exam-types', ExamTypeController::class)->except(['show', 'destroy']);
    Route::resource('grading-scales', GradingScaleController::class)->except(['show', 'destroy']);

    Route::get('institutions/{institution}/faculties', [FacultyController::class, 'index'])->name('faculties.index');
    Route::get('institutions/{institution}/faculties/create', [FacultyController::class, 'create'])->name('faculties.create');
    Route::post('institutions/{institution}/faculties', [FacultyController::class, 'store'])->name('faculties.store');
    Route::get('faculties/{faculty}/edit', [FacultyController::class, 'edit'])->name('faculties.edit');
    Route::put('faculties/{faculty}', [FacultyController::class, 'update'])->name('faculties.update');

    Route::get('faculties/{faculty}/departments', [DepartmentController::class, 'index'])->name('departments.index');
    Route::get('faculties/{faculty}/departments/create', [DepartmentController::class, 'create'])->name('departments.create');
    Route::post('faculties/{faculty}/departments', [DepartmentController::class, 'store'])->name('departments.store');
    Route::get('departments/{department}/edit', [DepartmentController::class, 'edit'])->name('departments.edit');
    Route::put('departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');

    Route::get('exam-types/{examType}/subjects', [ExamSubjectController::class, 'index'])->name('exam-subjects.index');
    Route::get('exam-types/{examType}/subjects/create', [ExamSubjectController::class, 'create'])->name('exam-subjects.create');
    Route::post('exam-types/{examType}/subjects', [ExamSubjectController::class, 'store'])->name('exam-subjects.store');
    Route::get('exam-subjects/{examSubject}/edit', [ExamSubjectController::class, 'edit'])->name('exam-subjects.edit');
    Route::put('exam-subjects/{examSubject}', [ExamSubjectController::class, 'update'])->name('exam-subjects.update');

    Route::get('content-studio', [ContentStudioController::class, 'index'])->name('content-studio.index');
    Route::get('content-studio/create', [ContentStudioController::class, 'create'])->name('content-studio.create');
    Route::post('content-studio', [ContentStudioController::class, 'store'])->name('content-studio.store');
    Route::get('content-studio/{contentProject}', [ContentStudioController::class, 'show'])->name('content-studio.show');
    Route::put('content-studio/{contentProject}/models', [ContentStudioController::class, 'updateModels'])->name('content-studio.update-models');
    Route::post('content-studio/{contentProject}/research', [ContentStudioController::class, 'runResearch'])->name('content-studio.run-research')->middleware('throttle:10,1');
    Route::post('content-studio/{contentProject}/research/approve', [ContentStudioController::class, 'approveResearch'])->name('content-studio.approve-research');
    Route::post('content-studio/{contentProject}/scheme', [ContentStudioController::class, 'runScheme'])->name('content-studio.run-scheme')->middleware('throttle:10,1');
    Route::post('content-studio/{contentProject}/scheme/approve', [ContentStudioController::class, 'approveScheme'])->name('content-studio.approve-scheme');
    Route::post('content-studio/{contentProject}/scheme/skip', [ContentStudioController::class, 'skipScheme'])->name('content-studio.skip-scheme');
    Route::post('content-studio/{contentProject}/blocks', [ContentStudioController::class, 'runBlocks'])->name('content-studio.run-blocks')->middleware('throttle:20,1');
    Route::post('content-studio/{contentProject}/blocks/approve', [ContentStudioController::class, 'approveBlocks'])->name('content-studio.approve-blocks');

    Route::post('content-studio/{contentProject}/topics/{canonicalTopic}/content', [ContentStudioController::class, 'runTopicContent'])->name('content-studio.content.run-topic')->middleware('throttle:10,1');
    Route::post('content-studio/{contentProject}/topics/{canonicalTopic}/content/mark-complete', [ContentStudioController::class, 'markTopicComplete'])->name('content-studio.content.mark-topic-complete');
    Route::post('content-studio/{contentProject}/topics/{canonicalTopic}/content/reset', [ContentStudioController::class, 'resetTopicContent'])->name('content-studio.content.reset-topic');
    Route::post('content-studio/{contentProject}/blocks/{contentBlock}/content', [ContentStudioController::class, 'runBlockContent'])->name('content-studio.content.run-block')->middleware('throttle:20,1');
    Route::post('content-studio/{contentProject}/blocks/{contentBlock}/content/regenerate', [ContentStudioController::class, 'regenerateBlockContent'])->name('content-studio.content.regenerate-block')->middleware('throttle:20,1');
    Route::put('content-studio/{contentProject}/blocks/{contentBlock}/content', [ContentStudioController::class, 'saveBlockContent'])->name('content-studio.content.save-block');
    Route::post('content-studio/{contentProject}/blocks/{contentBlock}/content/approve', [ContentStudioController::class, 'approveBlockContent'])->name('content-studio.content.approve-block');
    Route::post('content-studio/{contentProject}/blocks/{contentBlock}/advisory/dismiss', [ContentStudioController::class, 'dismissBlockAdvisory'])->name('content-studio.content.dismiss-advisory');
    Route::put('content-studio/{contentProject}/blocks/{contentBlock}/guidance', [ContentStudioController::class, 'updateBlockGuidance'])->name('content-studio.content.update-guidance');

    Route::get('ai-models', [AIModelController::class, 'index'])->name('ai-models.index');
    Route::get('ai-models/create', [AIModelController::class, 'create'])->name('ai-models.create');
    Route::post('ai-models', [AIModelController::class, 'store'])->name('ai-models.store');
    Route::get('ai-models/{ai_model}/edit', [AIModelController::class, 'edit'])->name('ai-models.edit');
    Route::put('ai-models/{ai_model}', [AIModelController::class, 'update'])->name('ai-models.update');
    Route::delete('ai-models/{ai_model}', [AIModelController::class, 'destroy'])->name('ai-models.destroy');
    Route::post('ai-models/{ai_model}/test', [AIModelController::class, 'testConnection'])->name('ai-models.test');
});
