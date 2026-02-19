<?php

use App\Http\Controllers\Admin\CanonicalTopicController;
use App\Http\Controllers\Admin\CourseDepartmentController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\DisciplineController;
use App\Http\Controllers\Admin\ExamSubjectController;
use App\Http\Controllers\Admin\ExamTypeController;
use App\Http\Controllers\Admin\FacultyController;
use App\Http\Controllers\Admin\InstitutionController;
use App\Models\Department;
use App\Models\Institution;
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
    Route::get('review-queue', fn () => Inertia::render('review-queue/index'))->name('review-queue.index');
    Route::get('notes', fn () => Inertia::render('notes/index'))->name('notes.index');
    Route::get('knowledge-graph', fn () => Inertia::render('knowledge-graph/index'))->name('knowledge-graph.index');
    Route::get('search', fn () => Inertia::render('search/index'))->name('search.index');
    Route::get('cgpa-simulator', fn () => Inertia::render('cgpa-simulator/index'))->name('cgpa-simulator.index');
    Route::get('upload', fn () => Inertia::render('upload/index'))->name('upload.index');
    Route::get('contributions', fn () => Inertia::render('contributions/index'))->name('contributions.index');
    Route::get('profile', fn () => Inertia::render('profile/index'))->name('profile.index');
    Route::get('progress', fn () => Inertia::render('progress/index'))->name('progress.index');
});

Route::middleware(['auth', 'verified', 'staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => Inertia::render('admin/dashboard'))->name('dashboard');
    Route::get('topics', [CanonicalTopicController::class, 'index'])->name('topics.index');
    Route::get('topics/create', [CanonicalTopicController::class, 'create'])->name('topics.create');
    Route::post('topics', [CanonicalTopicController::class, 'store'])->name('topics.store');
    Route::get('topics/{topic}/edit', [CanonicalTopicController::class, 'edit'])->name('topics.edit');
    Route::put('topics/{topic}', [CanonicalTopicController::class, 'update'])->name('topics.update');
    Route::get('topics/{topic}/preview', [CanonicalTopicController::class, 'preview'])->name('topics.preview');
    Route::post('topics/{topic}/toggle-publish', [CanonicalTopicController::class, 'togglePublish'])->name('topics.togglePublish');
    Route::get('questions', fn () => Inertia::render('admin/questions/index'))->name('questions.index');
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/create', [CourseController::class, 'create'])->name('courses.create');
    Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('courses/{course}/edit', [CourseController::class, 'edit'])->name('courses.edit');
    Route::put('courses/{course}', [CourseController::class, 'update'])->name('courses.update');

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
    Route::get('review-queue', fn () => Inertia::render('admin/review-queue/index'))->name('review-queue.index');
    Route::get('users', fn () => Inertia::render('admin/users/index'))->name('users.index');
    Route::get('imports', fn () => Inertia::render('admin/imports/index'))->name('imports.index');
    Route::get('settings', fn () => Inertia::render('admin/settings/index'))->name('settings.index');

    Route::resource('institutions', InstitutionController::class)->except(['show', 'destroy']);
    Route::resource('disciplines', DisciplineController::class)->except(['show', 'destroy']);
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
