<?php

use App\Http\Controllers\Student\CourseController as StudentCourseController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\ExamTimetableController;
use App\Http\Controllers\Student\LevelProgressionController;
use App\Http\Controllers\Student\NoteController;
use App\Http\Controllers\Student\OnboardingController;
use App\Http\Controllers\Student\ParentInvitationController;
use App\Http\Controllers\Student\PracticeController;
use App\Http\Controllers\Student\QuestionController as StudentQuestionController;
use App\Http\Controllers\Student\QuestionPaperController as StudentQuestionPaperController;
use App\Http\Controllers\Student\ReviewQueueController;
use App\Http\Controllers\Student\SearchController;
use App\Http\Controllers\Student\StudyPlanController;
use App\Http\Controllers\Student\StudyPreferenceController;
use App\Http\Controllers\Student\SubjectController as StudentSubjectController;
use App\Http\Controllers\Student\TopicController as StudentTopicController;
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
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.index');
    Route::post('onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::prefix('api/onboarding')->name('api.onboarding.')->group(function () {
        Route::get('institutions/search', [OnboardingController::class, 'searchInstitutions'])->name('institutions.search');
        Route::get('institutions/{institution}/faculties', [OnboardingController::class, 'faculties'])->name('faculties');
        Route::get('institutions/{institution}/level-progression', [OnboardingController::class, 'institutionTypeLevels'])->name('level-progression');
        Route::get('faculties/{faculty}/departments', [OnboardingController::class, 'departments'])->name('departments');
        Route::get('course-suggestions', [OnboardingController::class, 'courseSuggestions'])->name('course-suggestions');
        Route::get('courses/search', [OnboardingController::class, 'searchCourses'])->name('courses.search');
        Route::get('countries', [OnboardingController::class, 'countries'])->name('countries');
        Route::get('countries/{country}/education-systems', [OnboardingController::class, 'educationSystems'])->name('education-systems');
        Route::get('education-systems/{educationSystem}/tiers', [OnboardingController::class, 'curriculumTiers'])->name('tiers');
        Route::get('education-systems/{educationSystem}/streams', [OnboardingController::class, 'streams'])->name('streams');
        Route::get('education-levels/{educationLevel}/subjects', [OnboardingController::class, 'levelSubjects'])->name('level-subjects');
        Route::get('education-systems/{educationSystem}/assessment-types', [OnboardingController::class, 'assessmentTypes'])->name('assessment-types');
    });
});

Route::middleware(['auth', 'verified', 'onboarded'])->group(function () {
    Route::get('dashboard', [StudentDashboardController::class, 'index'])->name('dashboard');
    Route::post('parent-invitation/dismiss', [ParentInvitationController::class, 'dismiss'])->name('parent-invitation.dismiss');
    Route::post('parent-invitation/send', [ParentInvitationController::class, 'send'])->name('parent-invitation.send');
    Route::get('api/level-progression/check', [LevelProgressionController::class, 'check'])->name('api.level-progression.check');
    Route::post('level-progression/update', [LevelProgressionController::class, 'update'])->name('level-progression.update');
    Route::patch('study-preferences', StudyPreferenceController::class)->name('study-preferences.update');
    Route::post('study-plan/dismiss', [StudyPlanController::class, 'dismiss'])->name('study-plan.dismiss');
    Route::get('courses', [StudentCourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course}', [StudentCourseController::class, 'show'])->name('courses.show');
    Route::get('subjects/{levelSubject}', [StudentSubjectController::class, 'show'])->name('subjects.show');
    Route::get('topics/browse', [StudentTopicController::class, 'browse'])->name('topics.browse');
    Route::get('topics/{topic}/read', [StudentTopicController::class, 'read'])->name('topics.read');
    Route::get('topics/{topic}', [StudentTopicController::class, 'show'])->name('topics.show');
    Route::post('topics/{topic}/complete', [StudentTopicController::class, 'toggleComplete'])->name('topics.complete');
    Route::post('blocks/{block}/complete', [StudentTopicController::class, 'toggleBlockComplete'])->name('blocks.complete');
    Route::get('questions', [StudentQuestionController::class, 'index'])->name('questions.index');
    Route::get('questions/papers', [StudentQuestionPaperController::class, 'index'])->name('questions.papers.index');
    Route::get('questions/papers/{questionPaper}', [StudentQuestionPaperController::class, 'show'])->name('questions.papers.show');
    Route::get('questions/{question}', [StudentQuestionController::class, 'show'])->name('questions.show');
    Route::get('practice', fn () => redirect()->route('practice.configure'))->name('practice.index');
    Route::get('practice/configure', [PracticeController::class, 'configure'])->name('practice.configure');
    Route::post('practice/start', [PracticeController::class, 'start'])->name('practice.start');
    Route::get('api/practice/available-count', [PracticeController::class, 'availableCount'])->name('api.practice.available-count');
    Route::get('practice/{session}', [PracticeController::class, 'show'])->name('practice.show');
    Route::post('practice/{session}/answer', [PracticeController::class, 'answer'])->name('practice.answer');
    Route::post('practice/{session}/complete', [PracticeController::class, 'complete'])->name('practice.complete');
    Route::get('practice/{session}/results', [PracticeController::class, 'results'])->name('practice.results');
    Route::get('notes', [NoteController::class, 'index'])->name('notes.index');
    Route::get('notes/create', [NoteController::class, 'create'])->name('notes.create');
    Route::post('notes', [NoteController::class, 'store'])->name('notes.store');
    Route::get('notes/{note}', [NoteController::class, 'show'])->name('notes.show');
    Route::put('notes/{note}', [NoteController::class, 'update'])->name('notes.update');
    Route::delete('notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
    Route::get('review-queue', [ReviewQueueController::class, 'index'])->name('review-queue.index');
    Route::post('review-queue/start', [ReviewQueueController::class, 'start'])->name('review-queue.start');
    Route::get('api/review-queue/calendar', [ReviewQueueController::class, 'calendar'])->name('api.review-queue.calendar');
    Route::get('exam-timetable', [ExamTimetableController::class, 'index'])->name('exam-timetable.index');
    Route::post('exam-timetable', [ExamTimetableController::class, 'store'])->name('exam-timetable.store');
    Route::post('exam-timetable/start-studying', [ExamTimetableController::class, 'startStudying'])->name('exam-timetable.start-studying');
    Route::put('exam-timetable/{entry}', [ExamTimetableController::class, 'update'])->name('exam-timetable.update');
    Route::post('exam-timetable/{entry}/complete', [ExamTimetableController::class, 'complete'])->name('exam-timetable.complete');
    Route::post('exam-timetable/{entry}/mock', [ExamTimetableController::class, 'startMock'])->name('exam-timetable.start-mock');
    Route::delete('exam-timetable/{entry}', [ExamTimetableController::class, 'destroy'])->name('exam-timetable.destroy');
    Route::get('api/exam-timetable/calendar', [ExamTimetableController::class, 'calendarData'])->name('api.exam-timetable.calendar');
    Route::get('knowledge-graph', fn () => Inertia::render('knowledge-graph/index'))->name('knowledge-graph.index');
    Route::get('search', [SearchController::class, 'index'])->name('search.index');
    Route::get('api/search', [SearchController::class, 'search'])->middleware('throttle:60,1')->name('api.search');
    Route::get('cgpa-simulator', fn () => Inertia::render('cgpa-simulator/index'))->name('cgpa-simulator.index');
    Route::get('upload', fn () => Inertia::render('upload/index'))->name('upload.index');
    Route::get('contributions', fn () => Inertia::render('contributions/index'))->name('contributions.index');
    Route::get('profile', fn () => Inertia::render('profile/index'))->name('profile.index');
    Route::get('progress', fn () => Inertia::render('progress/index'))->name('progress.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/staff.php';
