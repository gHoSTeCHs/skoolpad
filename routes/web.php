<?php

use App\Http\Controllers\Admin\AnswerController;
use App\Http\Controllers\Admin\BulkImportController;
use App\Http\Controllers\Admin\CanonicalTopicController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\CourseDepartmentController;
use App\Http\Controllers\Admin\CourseMappingController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\DisciplineController;
use App\Http\Controllers\Admin\EducationSystemController;
use App\Http\Controllers\Admin\ExamSubjectController;
use App\Http\Controllers\Admin\ExamTypeController;
use App\Http\Controllers\Admin\FacultyController;
use App\Http\Controllers\Admin\InstitutionController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\ReviewQueueController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use App\Http\Controllers\Admin\UserController;
use App\Models\CanonicalTopic;
use App\Models\Department;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('design-showcase', function () {
    return Inertia::render('design-showcase');
})->name('design-showcase');

Route::get('architecture-showcase', function () {
    return Inertia::render('architecture-showcase');
})->name('architecture-showcase');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', fn () => Inertia::render('onboarding/index'))->name('onboarding.index');
});

Route::middleware(['auth', 'verified', 'onboarded'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');
    Route::get('courses', fn () => Inertia::render('courses/index'))->name('courses.index');
    Route::get('courses/{course}', fn (string $course) => Inertia::render('courses/show', ['course' => $course]))->name('courses.show');
    Route::get('topics/{topic}', fn (string $topic) => Inertia::render('topics/show', ['topic' => $topic]))->name('topics.show');
    Route::get('questions', fn () => Inertia::render('questions/index'))->name('questions.index');
    Route::get('questions/{question}', fn (string $question) => Inertia::render('questions/show', ['question' => $question]))->name('questions.show');
    Route::get('practice', fn () => Inertia::render('practice/index'))->name('practice.index');
    Route::get('notes', fn () => Inertia::render('notes/index'))->name('notes.index');
    Route::get('review-queue', fn () => Inertia::render('review-queue/index'))->name('review-queue.index');
    Route::get('knowledge-graph', fn () => Inertia::render('knowledge-graph/index'))->name('knowledge-graph.index');
    Route::get('search', fn () => Inertia::render('search/index'))->name('search.index');
    Route::get('cgpa-simulator', fn () => Inertia::render('cgpa-simulator/index'))->name('cgpa-simulator.index');
    Route::get('upload', fn () => Inertia::render('upload/index'))->name('upload.index');
    Route::get('contributions', fn () => Inertia::render('contributions/index'))->name('contributions.index');
    Route::get('profile', fn () => Inertia::render('profile/index'))->name('profile.index');
    Route::get('progress', fn () => Inertia::render('progress/index'))->name('progress.index');
});

Route::middleware(['auth', 'verified', 'staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('topics', [CanonicalTopicController::class, 'index'])->name('topics.index');
    Route::get('topics/create', [CanonicalTopicController::class, 'create'])->name('topics.create');
    Route::post('topics', [CanonicalTopicController::class, 'store'])->name('topics.store');
    Route::get('topics/{topic}/edit', [CanonicalTopicController::class, 'edit'])->name('topics.edit');
    Route::put('topics/{topic}', [CanonicalTopicController::class, 'update'])->name('topics.update');
    Route::get('topics/{topic}/preview', [CanonicalTopicController::class, 'preview'])->name('topics.preview');
    Route::post('topics/{topic}/toggle-publish', [CanonicalTopicController::class, 'togglePublish'])->name('topics.togglePublish');
    Route::get('questions', [QuestionController::class, 'index'])->name('questions.index');
    Route::get('questions/create', [QuestionController::class, 'create'])->name('questions.create');
    Route::post('questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::get('questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');
    Route::put('questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
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
            ->when($request->filled('q'), fn ($q) => $q->where('title', 'ilike', '%'.$request->string('q').'%'))
            ->orderBy('title')
            ->limit(20)
            ->get(['id', 'title']);
    })->name('api.topics.search');
    Route::get('api/institutions/{institution}/courses', function (Institution $institution, Request $request) {
        return InstitutionCourse::query()
            ->where('institution_id', $institution->id)
            ->when($request->filled('q'), fn ($q) => $q->where('course_code', 'ilike', '%'.$request->string('q').'%'))
            ->orderBy('course_code')
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
    Route::post('import/topics', [BulkImportController::class, 'importTopics'])->name('import.topics');
    Route::post('import/course-mappings', [BulkImportController::class, 'importCourseMappings'])->name('import.courseMappings');
    Route::post('import/course-offerings', [BulkImportController::class, 'importCourseOfferings'])->name('import.courseOfferings');
    Route::post('import/questions', [BulkImportController::class, 'importQuestions'])->name('import.questions');
    Route::get('import/history', [BulkImportController::class, 'history'])->name('import.history');
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::get('settings/plans', [SubscriptionPlanController::class, 'index'])->name('settings.plans.index');
    Route::get('settings/plans/{plan}/edit', [SubscriptionPlanController::class, 'edit'])->name('settings.plans.edit');
    Route::put('settings/plans/{plan}', [SubscriptionPlanController::class, 'update'])->name('settings.plans.update');

    Route::resource('institutions', InstitutionController::class)->except(['show', 'destroy']);
    Route::resource('disciplines', DisciplineController::class)->except(['show', 'destroy']);
    Route::resource('education-systems', EducationSystemController::class)->except(['destroy']);
    Route::resource('exam-types', ExamTypeController::class)->except(['show', 'destroy']);

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
});

require __DIR__.'/settings.php';
