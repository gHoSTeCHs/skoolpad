<?php

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
    Route::get('topics', fn () => Inertia::render('admin/topics/index'))->name('topics.index');
    Route::get('questions', fn () => Inertia::render('admin/questions/index'))->name('questions.index');
    Route::get('institutions', fn () => Inertia::render('admin/institutions/index'))->name('institutions.index');
    Route::get('courses', fn () => Inertia::render('admin/courses/index'))->name('courses.index');
    Route::get('review-queue', fn () => Inertia::render('admin/review-queue/index'))->name('review-queue.index');
    Route::get('users', fn () => Inertia::render('admin/users/index'))->name('users.index');
    Route::get('imports', fn () => Inertia::render('admin/imports/index'))->name('imports.index');
    Route::get('settings', fn () => Inertia::render('admin/settings/index'))->name('settings.index');
});

require __DIR__.'/settings.php';
