# Phase 1.5: Admin Questions & Answers — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete question paper authoring system with 16 question type builders, shared contexts, hierarchical nesting, and a split-pane paper builder UI.

**Architecture:** Paper-first workflow — admin creates a paper, adds sections, builds questions within sections using type-specific form builders with live preview. Standalone questions also supported for practice pools. All type-specific data stored in `response_config` JSONB on the questions table (MCQ migrated from separate `question_options` table).

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, TypeScript, Tailwind CSS v4, Pest 4

**Design Doc:** `C:\Users\hp\Documents\Notes\STARTUPs\E-learning\Architecture Redesign\Phase-1.5-Admin-Questions-Design.md`

---

## Existing Code Reference

**Models:** `Question`, `QuestionPaper`, `QuestionSection`, `QuestionContext`, `QuestionContextLink`, `QuestionOption` (to be removed), `QuestionBlockLink`, `QuestionAssessmentLink`, `AssessmentType` — all in `app/Models/`

**Enums:** `QuestionType` (16 cases), `QuestionStatus`, `QuestionDifficulty`, `QuestionSource`, `ContextType` (9 cases), `BloomLevel` — all in `app/Enums/`

**Controllers:** `QuestionController`, `AnswerController` — in `app/Http/Controllers/Admin/`

**Routes:** Questions CRUD at lines 86-92 of `routes/web.php`

**Frontend:** `resources/js/pages/admin/questions/` (index, create, edit, answers), `resources/js/components/admin/mcq-options-builder.tsx`, `resources/js/components/admin/topic-linker.tsx`

**Types:** `resources/js/types/questions.ts`

**Tests:** `tests/Feature/Admin/QuestionControllerTest.php`, `tests/Feature/QuestionSystemTest.php`

**Showcase:** `resources/js/pages/architecture-showcase.tsx` lines 1250-1718 (QuestionTypeBadge, PaperQuestionNode, ContextCard)

**Patterns:** Use `Paginates` trait with `self::DEFAULT_PER_PAGE`, `FormField`, `FormWrapper`, `FormPageLayout`, `useFilterHandlers`, `useSlug`, Wayfinder imports, `scopeSearch` on models. No single-line comments, only jsdoc where necessary.

---

## Task 1: MCQ Migration — Move Options to response_config

**Files:**
- Create: `database/migrations/2026_02_25_000001_migrate_mcq_options_to_response_config.php`
- Modify: `app/Models/Question.php` — remove `options()` relationship
- Delete: `app/Models/QuestionOption.php`
- Delete: `database/factories/QuestionOptionFactory.php`
- Modify: `database/factories/QuestionFactory.php` — update `withResponseConfig` state
- Modify: `tests/Feature/Admin/QuestionControllerTest.php` — remove options assertions, use response_config
- Modify: `tests/Feature/QuestionSystemTest.php` — remove QuestionOption tests

**Context:** Currently MCQ questions store options in a separate `question_options` table. All 16 question types should use the `response_config` JSONB column on the `questions` table. This migration moves existing MCQ data into `response_config` and drops the old table.

**Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('questions')
            ->where('question_type', 'mcq')
            ->orWhere('question_type', 'multi_select_mcq')
            ->each(function ($question) {
                $options = DB::table('question_options')
                    ->where('question_id', $question->id)
                    ->orderBy('sort_order')
                    ->get();

                if ($options->isEmpty()) {
                    return;
                }

                $responseConfig = [
                    'options' => $options->map(fn ($opt) => [
                        'label' => $opt->label,
                        'text' => $opt->content,
                        'is_correct' => (bool) $opt->is_correct,
                    ])->values()->toArray(),
                ];

                DB::table('questions')
                    ->where('id', $question->id)
                    ->update(['response_config' => json_encode($responseConfig)]);
            });

        Schema::dropIfExists('question_options');
    }

    public function down(): void
    {
        Schema::create('question_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->string('label', 5);
            $table->text('content');
            $table->boolean('is_correct')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }
};
```

**Step 2: Remove QuestionOption model and factory**

Delete `app/Models/QuestionOption.php` and `database/factories/QuestionOptionFactory.php`.

**Step 3: Update Question model**

In `app/Models/Question.php`, remove the `options()` relationship method and the `use HasFactory` import from `QuestionOption` if referenced anywhere.

**Step 4: Update QuestionFactory**

In `database/factories/QuestionFactory.php`, update the `withResponseConfig` state to be the default for MCQ:

```php
public function definition(): array
{
    return [
        'institution_course_id' => InstitutionCourse::factory(),
        'question_type' => QuestionType::Mcq,
        'content' => fake()->paragraph(),
        'marks' => fake()->randomElement([1, 2, 5, 10]),
        'difficulty_level' => fake()->randomElement(QuestionDifficulty::cases()),
        'bloom_level' => fake()->randomElement(BloomLevel::cases()),
        'source' => QuestionSource::Manual,
        'status' => QuestionStatus::Published,
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => fake()->sentence(), 'is_correct' => false],
                ['label' => 'B', 'text' => fake()->sentence(), 'is_correct' => true],
                ['label' => 'C', 'text' => fake()->sentence(), 'is_correct' => false],
                ['label' => 'D', 'text' => fake()->sentence(), 'is_correct' => false],
            ],
        ],
        'created_by' => User::factory(),
    ];
}
```

Remove the old `withResponseConfig` state (it's now the default). Keep `theory()`, `forPaper()`, `group()` states. Add states for other types as needed.

**Step 5: Update QuestionControllerTest**

Replace all `options` array assertions with `response_config` assertions. The store/update tests should send `response_config` instead of `options`.

**Step 6: Update QuestionSystemTest**

Remove all `QuestionOption`-related tests. Add tests verifying `response_config` is correctly cast to array.

**Step 7: Run migration and tests**

```bash
"C:/Users/hp/.config/herd/bin/php.bat" artisan migrate
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact --filter=QuestionControllerTest
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact --filter=QuestionSystemTest
```

**Step 8: Commit**

```bash
git add -A && git commit -m "migrate MCQ options to response_config JSONB, drop question_options table"
```

---

## Task 2: ResponseConfigValidator

**Files:**
- Create: `app/Rules/ResponseConfigValidator.php`
- Create: `tests/Unit/Rules/ResponseConfigValidatorTest.php`

**Context:** Each of the 16 question types has a different `response_config` shape. This validator class provides per-type validation rules that form requests delegate to.

**Step 1: Create the validator**

```php
<?php

namespace App\Rules;

use App\Enums\QuestionType;
use Illuminate\Contracts\Validation\ValidationRule;
use Closure;

class ResponseConfigValidator implements ValidationRule
{
    public function __construct(private string $questionType) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->isWrittenType()) {
            if ($value !== null) {
                $fail('Written question types must not have response_config.');
            }
            return;
        }

        if ($this->questionType === 'group') {
            if ($value !== null) {
                $fail('Group questions must not have response_config.');
            }
            return;
        }

        if ($value === null) {
            $fail('This question type requires response_config.');
            return;
        }

        $config = is_array($value) ? $value : json_decode($value, true);
        if (!is_array($config)) {
            $fail('response_config must be a valid JSON object.');
            return;
        }

        $method = 'validate' . str_replace('_', '', ucwords($this->questionType, '_'));
        if (method_exists($this, $method)) {
            $this->$method($config, $fail);
        }
    }

    private function isWrittenType(): bool
    {
        return in_array($this->questionType, ['theory', 'short_answer', 'essay']);
    }

    private function validateMcq(array $config, Closure $fail): void
    {
        if (!isset($config['options']) || !is_array($config['options'])) {
            $fail('MCQ requires an options array.');
            return;
        }

        $options = $config['options'];
        if (count($options) < 2 || count($options) > 6) {
            $fail('MCQ requires 2-6 options.');
            return;
        }

        $correctCount = 0;
        foreach ($options as $i => $option) {
            if (!isset($option['label']) || !isset($option['text'])) {
                $fail("Option {$i} requires label and text.");
                return;
            }
            if (!empty($option['is_correct'])) {
                $correctCount++;
            }
        }

        if ($correctCount !== 1) {
            $fail('MCQ requires exactly one correct option.');
        }
    }

    private function validateMultiSelectMcq(array $config, Closure $fail): void
    {
        if (!isset($config['options']) || !is_array($config['options'])) {
            $fail('Multi-select MCQ requires an options array.');
            return;
        }

        $options = $config['options'];
        if (count($options) < 2 || count($options) > 6) {
            $fail('Multi-select MCQ requires 2-6 options.');
            return;
        }

        $correctCount = collect($options)->where('is_correct', true)->count();
        if ($correctCount < 2) {
            $fail('Multi-select MCQ requires at least 2 correct options.');
        }
    }

    private function validateTrueFalse(array $config, Closure $fail): void
    {
        if (!array_key_exists('correct_answer', $config) || !is_bool($config['correct_answer'])) {
            $fail('True/False requires a boolean correct_answer.');
        }
    }

    private function validateFillBlank(array $config, Closure $fail): void
    {
        if (!isset($config['blanks']) || !is_array($config['blanks']) || count($config['blanks']) < 1) {
            $fail('Fill-blank requires at least one blank.');
            return;
        }

        foreach ($config['blanks'] as $i => $blank) {
            if (!isset($blank['position']) || !isset($blank['correct_answers']) || !is_array($blank['correct_answers']) || count($blank['correct_answers']) < 1) {
                $fail("Blank {$i} requires position and at least one correct_answer.");
                return;
            }
        }
    }

    private function validateCloze(array $config, Closure $fail): void
    {
        if (!isset($config['gaps']) || !is_array($config['gaps']) || count($config['gaps']) < 1) {
            $fail('Cloze requires at least one gap.');
            return;
        }

        foreach ($config['gaps'] as $i => $gap) {
            if (!isset($gap['position']) || !isset($gap['options']) || !is_array($gap['options']) || count($gap['options']) < 2) {
                $fail("Gap {$i} requires position and at least 2 options.");
                return;
            }
            if (!isset($gap['correct']) || !is_int($gap['correct'])) {
                $fail("Gap {$i} requires a correct index.");
                return;
            }
        }
    }

    private function validateMatching(array $config, Closure $fail): void
    {
        if (!isset($config['pairs']) || !is_array($config['pairs']) || count($config['pairs']) < 2) {
            $fail('Matching requires at least 2 pairs.');
            return;
        }

        foreach ($config['pairs'] as $i => $pair) {
            if (!isset($pair['left']) || !isset($pair['right'])) {
                $fail("Pair {$i} requires left and right values.");
                return;
            }
        }
    }

    private function validateMatrixMatching(array $config, Closure $fail): void
    {
        if (!isset($config['left']) || !is_array($config['left']) || count($config['left']) < 2) {
            $fail('Matrix matching requires at least 2 left items.');
            return;
        }
        if (!isset($config['right']) || !is_array($config['right']) || count($config['right']) < 2) {
            $fail('Matrix matching requires at least 2 right items.');
            return;
        }
        if (!isset($config['mapping']) || !is_array($config['mapping'])) {
            $fail('Matrix matching requires a mapping object.');
        }
    }

    private function validateOrdering(array $config, Closure $fail): void
    {
        if (!isset($config['items']) || !is_array($config['items']) || count($config['items']) < 2) {
            $fail('Ordering requires at least 2 items.');
            return;
        }
        if (!isset($config['correct_order']) || !is_array($config['correct_order'])) {
            $fail('Ordering requires a correct_order array.');
        }
    }

    private function validateDiagramLabel(array $config, Closure $fail): void
    {
        if (!isset($config['labels']) || !is_array($config['labels']) || count($config['labels']) < 1) {
            $fail('Diagram label requires at least one label.');
            return;
        }

        foreach ($config['labels'] as $i => $label) {
            if (!isset($label['label']) || !isset($label['answer'])) {
                $fail("Label {$i} requires label identifier and answer.");
                return;
            }
        }
    }

    private function validateCalculation(array $config, Closure $fail): void
    {
        if (!isset($config['answer'])) {
            $fail('Calculation requires an answer.');
        }
    }

    private function validateNumericEntry(array $config, Closure $fail): void
    {
        if (!isset($config['answer']) || !is_numeric($config['answer'])) {
            $fail('Numeric entry requires a numeric answer.');
        }
    }

    private function validateAssertionReason(array $config, Closure $fail): void
    {
        if (!isset($config['assertion']) || !is_string($config['assertion'])) {
            $fail('Assertion-reason requires an assertion string.');
            return;
        }
        if (!isset($config['reason']) || !is_string($config['reason'])) {
            $fail('Assertion-reason requires a reason string.');
            return;
        }
        if (!isset($config['options']) || !is_array($config['options']) || count($config['options']) < 2) {
            $fail('Assertion-reason requires at least 2 answer options.');
        }
    }
}
```

**Step 2: Write unit tests**

Create `tests/Unit/Rules/ResponseConfigValidatorTest.php` with tests for each type: valid config passes, invalid config fails, null config for written types passes, null config for non-written types fails.

Run: `"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact --filter=ResponseConfigValidatorTest`

**Step 3: Commit**

```bash
git add -A && git commit -m "add ResponseConfigValidator for per-type response_config validation"
```

---

## Task 3: Question Paper + Section Backend

**Files:**
- Create: `app/Http/Controllers/Admin/QuestionPaperController.php`
- Create: `app/Http/Controllers/Admin/QuestionSectionController.php`
- Create: `app/Http/Requests/Admin/StoreQuestionPaperRequest.php`
- Create: `app/Http/Requests/Admin/UpdateQuestionPaperRequest.php`
- Create: `app/Http/Requests/Admin/StoreQuestionSectionRequest.php`
- Create: `app/Http/Requests/Admin/UpdateQuestionSectionRequest.php`
- Modify: `routes/web.php` — add paper and section routes
- Create: `tests/Feature/Admin/QuestionPaperControllerTest.php`
- Create: `tests/Feature/Admin/QuestionSectionControllerTest.php`

**Context:** QuestionPapers are the primary container. They link to either an `institution_course_id` (university exam) OR an `assessment_type_id` (WAEC/NECO). Sections sit within papers and hold questions.

**QuestionPaperController methods:**

- `index()` — paginated list with filters (institution, assessment_type, year, search). Use `Paginates` trait.
- `create()` — return form with institutions, assessment types, enum options
- `store()` — validate and create paper, redirect to `build` page
- `build(QuestionPaper $paper)` — return the paper builder SPA page with all sections, questions (nested), and contexts eager-loaded
- `update(QuestionPaper $paper)` — update paper metadata (inline from builder header)
- `destroy(QuestionPaper $paper)` — delete paper (cascades to sections, questions)

**QuestionSectionController methods:**

- `store(QuestionPaper $paper)` — create section within paper
- `update(QuestionPaper $paper, QuestionSection $section)` — update section
- `destroy(QuestionPaper $paper, QuestionSection $section)` — delete section
- `reorder(QuestionPaper $paper)` — accept `{sections: [{id, sort_order}]}` and bulk update

**Routes to add in `routes/web.php`:**

```php
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
```

**StoreQuestionPaperRequest rules:**

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'institution_course_id' => ['nullable', 'uuid', 'exists:institution_courses,id'],
        'assessment_type_id' => ['nullable', 'uuid', 'exists:assessment_types,id'],
        'academic_session' => ['nullable', 'string', 'max:50'],
        'semester' => ['nullable', 'string', 'in:first,second'],
        'year' => ['nullable', 'integer', 'min:1990', 'max:' . (date('Y') + 1)],
        'total_marks' => ['nullable', 'integer', 'min:1'],
        'duration_minutes' => ['nullable', 'integer', 'min:1'],
        'instructions' => ['nullable', 'string'],
    ];
}
```

**Build page data shape** (critical — this powers the paper builder SPA):

```php
public function build(QuestionPaper $paper): Response
{
    $paper->load([
        'institutionCourse:id,institution_id,course_code',
        'institutionCourse.institution:id,name,abbreviation',
        'assessmentType:id,name,slug',
        'sections' => fn ($q) => $q->orderBy('sort_order'),
        'sections.questions' => fn ($q) => $q->whereNull('parent_question_id')->orderBy('sort_order'),
        'sections.questions.children' => fn ($q) => $q->orderBy('sort_order'),
        'sections.questions.children.children' => fn ($q) => $q->orderBy('sort_order'),
        'sections.questions.children.children.children' => fn ($q) => $q->orderBy('sort_order'),
        'sections.questions.questionContextLinks',
        'contexts',
    ]);

    return Inertia::render('admin/question-papers/build', [
        'paper' => $paper,
        'enum_options' => [
            'question_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionType::cases()),
            'difficulties' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionDifficulty::cases()),
            'bloom_levels' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], BloomLevel::cases()),
            'context_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], ContextType::cases()),
        ],
    ]);
}
```

**Tests:** Write feature tests covering index (pagination, filters), store (validation, redirect to build), build (loads all nested data), update, destroy, section CRUD, section reorder. Follow existing `QuestionControllerTest` patterns.

Run: `"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact --filter=QuestionPaperControllerTest`

**Commit:**

```bash
git add -A && git commit -m "add QuestionPaper + QuestionSection controllers, routes, form requests, tests"
```

---

## Task 4: Question Context Backend

**Files:**
- Create: `app/Http/Controllers/Admin/QuestionContextController.php`
- Create: `app/Http/Requests/Admin/StoreQuestionContextRequest.php`
- Create: `app/Http/Requests/Admin/UpdateQuestionContextRequest.php`
- Modify: `routes/web.php` — add context routes
- Create: `tests/Feature/Admin/QuestionContextControllerTest.php`

**Context:** Contexts are shared resources (passages, tables, diagrams) linked to questions via the `question_context_links` pivot table. They can be scoped to a paper or global (reusable).

**QuestionContextController methods:**

- `store(QuestionPaper $paper)` — create context within a paper
- `update(QuestionPaper $paper, QuestionContext $context)` — update context
- `destroy(QuestionPaper $paper, QuestionContext $context)` — delete context
- `link(Question $question)` — link a context to a question (JSON API, accepts `{context_id, sort_order?, label?}`)
- `unlink(Question $question, QuestionContext $context)` — unlink context from question

**Routes:**

```php
Route::post('question-papers/{questionPaper}/contexts', [QuestionContextController::class, 'store'])->name('question-papers.contexts.store');
Route::put('question-papers/{questionPaper}/contexts/{questionContext}', [QuestionContextController::class, 'update'])->name('question-papers.contexts.update');
Route::delete('question-papers/{questionPaper}/contexts/{questionContext}', [QuestionContextController::class, 'destroy'])->name('question-papers.contexts.destroy');
Route::post('questions/{question}/contexts/link', [QuestionContextController::class, 'link'])->name('questions.contexts.link');
Route::delete('questions/{question}/contexts/{questionContext}/unlink', [QuestionContextController::class, 'unlink'])->name('questions.contexts.unlink');
```

**StoreQuestionContextRequest rules:**

```php
public function rules(): array
{
    return [
        'context_type' => ['required', 'string', Rule::in(ContextType::values())],
        'title' => ['nullable', 'string', 'max:255'],
        'content' => ['nullable', 'string'],
        'media_url' => ['nullable', 'url', 'max:2048'],
        'table_data' => ['nullable', 'array'],
        'table_data.headers' => ['required_with:table_data', 'array', 'min:1'],
        'table_data.headers.*' => ['required', 'string'],
        'table_data.rows' => ['required_with:table_data', 'array', 'min:1'],
        'table_data.rows.*' => ['required', 'array'],
        'word_bank' => ['nullable', 'array', 'min:1'],
        'word_bank.*' => ['required', 'string'],
        'language' => ['nullable', 'string', 'max:50'],
    ];
}
```

**Tests:** Feature tests for context CRUD within a paper, linking/unlinking to questions. Verify cascade deletes, context type validation.

**Commit:**

```bash
git add -A && git commit -m "add QuestionContext controller with linking support, routes, tests"
```

---

## Task 5: Question Controller Expansion

**Files:**
- Modify: `app/Http/Controllers/Admin/QuestionController.php`
- Modify: `app/Http/Requests/Admin/StoreQuestionRequest.php`
- Modify: `app/Http/Requests/Admin/UpdateQuestionRequest.php`
- Modify: `tests/Feature/Admin/QuestionControllerTest.php`

**Context:** The existing QuestionController handles only MCQ options and topic linking. It needs to handle `response_config` for all 16 types, `parent_question_id` for nesting, `question_section_id` and `question_paper_id` for paper association.

**Key changes to QuestionController:**

1. `store()` — accept `response_config` (validated by ResponseConfigValidator), `question_paper_id`, `question_section_id`, `parent_question_id`, `exam_subject_id`. Remove `syncOptions()` call. Set `depth_level` based on parent.

2. `update()` — same expansions. Handle type changes (clear `response_config` when switching between types that need it and those that don't).

3. Remove `syncOptions()` private method entirely (MCQ options now in response_config).

4. Add `reorder()` method — accept `{questions: [{id, sort_order}]}` for drag-and-drop reordering within a section.

**StoreQuestionRequest updated rules:**

```php
public function rules(): array
{
    $type = $this->input('question_type', 'mcq');

    return [
        'question_paper_id' => ['nullable', 'uuid', 'exists:question_papers,id'],
        'question_section_id' => ['nullable', 'uuid', 'exists:question_sections,id'],
        'parent_question_id' => ['nullable', 'uuid', 'exists:questions,id'],
        'institution_course_id' => ['nullable', 'uuid', 'exists:institution_courses,id', 'required_without:exam_subject_id'],
        'exam_subject_id' => ['nullable', 'uuid', 'exists:exam_subjects,id', 'required_without:institution_course_id'],
        'question_type' => ['required', 'string', Rule::in(QuestionType::values())],
        'content' => ['required', 'string'],
        'marks' => ['nullable', 'integer', 'min:1'],
        'difficulty_level' => ['nullable', 'string', Rule::in(QuestionDifficulty::values())],
        'bloom_level' => ['nullable', 'string', Rule::in(BloomLevel::values())],
        'source' => ['required', 'string', Rule::in(QuestionSource::values())],
        'status' => ['required', 'string', Rule::in([QuestionStatus::Draft->value, QuestionStatus::InReview->value])],
        'response_config' => ['nullable', 'array', new ResponseConfigValidator($type)],
        'topic_ids' => ['nullable', 'array', 'min:1'],
        'topic_ids.*' => ['uuid', 'exists:canonical_topics,id'],
        'primary_topic_id' => ['nullable', 'uuid', 'in_array:topic_ids.*'],
        'year' => ['nullable', 'integer'],
        'semester' => ['nullable', 'string', 'in:first,second'],
    ];
}
```

**Note:** The `institution_course_id` / `exam_subject_id` XOR is relaxed for paper questions — when a question belongs to a paper, the paper carries the course/assessment association. Questions within papers may have both null. Add conditional logic:

```php
'institution_course_id' => ['nullable', 'uuid', 'exists:institution_courses,id',
    Rule::requiredIf(fn () => !$this->filled('exam_subject_id') && !$this->filled('question_paper_id'))],
```

**New route for reorder:**

```php
Route::post('questions/reorder', [QuestionController::class, 'reorder'])->name('questions.reorder');
```

**Tests:** Expand existing tests to cover: storing questions with response_config for MCQ, true_false, calculation, fill_blank types. Test nesting (parent_question_id). Test paper-scoped questions. Test reorder endpoint.

**Commit:**

```bash
git add -A && git commit -m "expand QuestionController for response_config, nesting, paper/section support"
```

---

## Task 6: TypeScript Types + Component Extraction

**Files:**
- Modify: `resources/js/types/questions.ts` — add all response_config shapes
- Create: `resources/js/components/skoolpad/questions/question-type-badge.tsx`
- Create: `resources/js/components/skoolpad/questions/question-renderer.tsx`
- Create: `resources/js/components/skoolpad/questions/context-card.tsx`
- Create: `resources/js/components/skoolpad/questions/index.ts`
- Modify: `resources/js/pages/architecture-showcase.tsx` — import from extracted components

**TypeScript types to add/update in `questions.ts`:**

```typescript
export type QuestionType =
    | 'mcq' | 'multi_select_mcq' | 'theory' | 'short_answer' | 'essay'
    | 'fill_blank' | 'cloze' | 'matching' | 'ordering' | 'true_false'
    | 'diagram_label' | 'calculation' | 'assertion_reason' | 'matrix_matching'
    | 'numeric_entry' | 'group';

export type ContextType =
    | 'passage' | 'diagram' | 'table' | 'case_study' | 'code_snippet'
    | 'map' | 'graph' | 'word_bank' | 'equation_set';

export interface McqConfig {
    options: { label: string; text: string; is_correct: boolean }[];
}

export interface MultiSelectMcqConfig extends McqConfig {
    min_correct?: number;
    max_correct?: number;
}

export interface TrueFalseConfig {
    correct_answer: boolean;
    requires_justification?: boolean;
}

export interface FillBlankConfig {
    blanks: { position: number; correct_answers: string[] }[];
    case_sensitive?: boolean;
}

export interface ClozeConfig {
    gaps: { position: number; options: string[]; correct: number }[];
}

export interface MatchingConfig {
    pairs: { left: string; right: string }[];
    distractors?: string[];
}

export interface MatrixMatchingConfig {
    left: string[];
    right: string[];
    mapping: Record<number, number[]>;
}

export interface OrderingConfig {
    items: string[];
    correct_order: number[];
}

export interface DiagramLabelConfig {
    labels: { label: string; answer: string; x?: number; y?: number }[];
}

export interface CalculationConfig {
    answer: string;
    unit?: string;
    tolerance?: number;
    requires_working?: boolean;
}

export interface NumericEntryConfig {
    answer: number;
    tolerance?: number;
    unit?: string;
}

export interface AssertionReasonConfig {
    assertion: string;
    reason: string;
    options: { label: string; text: string; is_correct: boolean }[];
}

export type ResponseConfig =
    | McqConfig | MultiSelectMcqConfig | TrueFalseConfig | FillBlankConfig
    | ClozeConfig | MatchingConfig | MatrixMatchingConfig | OrderingConfig
    | DiagramLabelConfig | CalculationConfig | NumericEntryConfig
    | AssertionReasonConfig | null;

export interface QuestionPaper {
    id: string;
    title: string;
    institution_course_id?: string;
    assessment_type_id?: string;
    academic_session?: string;
    semester?: string;
    year?: number;
    total_marks?: number;
    duration_minutes?: number;
    instructions?: string;
    is_published: boolean;
    sections: QuestionSection[];
    contexts: QuestionContext[];
}

export interface QuestionSection {
    id: string;
    label: string;
    instruction?: string;
    marks?: number;
    required_count?: number;
    sort_order: number;
    questions: QuestionNode[];
}

export interface QuestionContext {
    id: string;
    context_type: ContextType;
    title?: string;
    content?: string;
    media_url?: string;
    table_data?: { headers: string[]; rows: string[][] };
    word_bank?: string[];
    language?: string;
}

export interface QuestionNode {
    id: string;
    question_type: QuestionType;
    question_number?: string;
    display_label?: string;
    content: string;
    marks: number | null;
    sort_order: number;
    depth_level: number;
    response_config: ResponseConfig;
    choice_group?: { required: string[]; chooseN: number; optional: string[] };
    difficulty_level?: string;
    bloom_level?: string;
    status: string;
    context_links?: { context_id: string; sort_order: number; label?: string }[];
    children: QuestionNode[];
}
```

**Component extraction:** Extract `QuestionTypeBadge`, `PaperQuestionNode` (rename to `QuestionRenderer`), and `ContextCard` from `architecture-showcase.tsx` into `resources/js/components/skoolpad/questions/`. Follow the same pattern used for `block-tree/` extraction — keep showcase alive by importing from extracted components.

The showcase's `QUESTION_TYPE_META` constant, `QuestionTypeBadge` function, `PaperQuestionNode` component, and `ContextCard` component should be moved to the new files, and the showcase updated to import from them.

**Commit:**

```bash
git add -A && git commit -m "add question TypeScript types, extract QuestionTypeBadge, QuestionRenderer, ContextCard from showcase"
```

---

## Task 7: Type-Specific Builders (All 16)

**Files:**
- Create: `resources/js/components/admin/question-builder/type-specific/mcq-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/multi-select-mcq-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/true-false-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/fill-blank-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/cloze-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/matching-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/matrix-matching-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/ordering-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/diagram-label-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/calculation-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/numeric-entry-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/assertion-reason-builder.tsx`
- Create: `resources/js/components/admin/question-builder/type-specific/index.ts`
- Create: `resources/js/components/admin/question-builder/question-type-selector.tsx`
- Create: `resources/js/components/admin/question-builder/question-editor.tsx`
- Modify: `resources/js/components/admin/mcq-options-builder.tsx` — delete (replaced by mcq-builder)

**Context:** Each builder is a React component that takes `value: ResponseConfig | null` and `onChange: (config: ResponseConfig) => void` props. The parent `question-editor.tsx` wraps the common fields (content, marks, difficulty, bloom level) and renders the appropriate type-specific builder based on `question_type`.

**Common interface for all type-specific builders:**

```typescript
export interface TypeBuilderProps<T> {
    value: T | null;
    onChange: (config: T) => void;
    errors?: Record<string, string>;
}
```

**Written types (theory, short_answer, essay):** No builder needed — these have no `response_config`. The `question-editor.tsx` shows only the common fields when these types are selected.

**Group type:** No builder needed. Shows "Add Sub-Question" button (handled by the parent paper builder, not the type builder).

**McqBuilder example structure:**

```tsx
export function McqBuilder({ value, onChange, errors }: TypeBuilderProps<McqConfig>) {
    const options = value?.options ?? [
        { label: 'A', text: '', is_correct: false },
        { label: 'B', text: '', is_correct: false },
    ];

    /* Add/remove options (min 2, max 6), auto-label A-F */
    /* Radio button for correct answer selection */
    /* Text input per option */
    /* Drag handle for reorder (future) */
}
```

**question-editor.tsx** — the common wrapper:

```tsx
interface QuestionEditorProps {
    questionType: QuestionType;
    content: string;
    marks: number | null;
    difficultyLevel: string;
    bloomLevel: string;
    responseConfig: ResponseConfig;
    onContentChange: (content: string) => void;
    onMarksChange: (marks: number | null) => void;
    onDifficultyChange: (level: string) => void;
    onBloomChange: (level: string) => void;
    onResponseConfigChange: (config: ResponseConfig) => void;
    enumOptions: { difficulties: EnumOption[]; bloom_levels: EnumOption[] };
    errors?: Record<string, string>;
}
```

It renders: content Textarea, marks Input, difficulty Select, bloom level Select, then the type-specific builder based on `questionType`.

**question-type-selector.tsx** — dropdown that shows all 16 types with QuestionTypeBadge preview. When type changes, clears `response_config` and shows appropriate builder.

**Commit:**

```bash
git add -A && git commit -m "add all 16 question type builders + question editor wrapper + type selector"
```

---

## Task 8: Question Papers Index + Create Pages

**Files:**
- Create: `resources/js/pages/admin/question-papers/index.tsx`
- Create: `resources/js/pages/admin/question-papers/create.tsx`

**Context:** Standard admin index page (like institutions index) with DataTable, search, filters. Create page collects paper metadata and redirects to the builder.

**Index page:** DataTable with columns: title, course/assessment, year, sections count, questions count, total marks, duration, status. Filters: institution, assessment type, year. Search by title. "Create Paper" button.

Follow existing patterns: `PageHeader`, `SearchInput`, `DataTable`, `useFilterHandlers`, Wayfinder imports (`QuestionPaperController.index.url()`).

**Create page:** Use `FormPageLayout` + `FormWrapper` + `FormField` pattern. Fields: title, institution selector (cascading to course), OR assessment type selector, academic session, semester, year, total marks, duration, instructions textarea.

The "source" toggle (Institution Course vs Assessment Type) shows/hides the appropriate selectors — similar to the existing question form's institution→course cascade.

On submit, redirect to `/admin/question-papers/{paper}/build`.

**Commit:**

```bash
git add -A && git commit -m "add question papers index and create pages"
```

---

## Task 9: Paper Builder Page

**Files:**
- Create: `resources/js/pages/admin/question-papers/build.tsx`
- Create: `resources/js/components/admin/question-builder/paper-tree.tsx`
- Create: `resources/js/components/admin/question-builder/paper-header.tsx`
- Create: `resources/js/components/admin/question-builder/section-editor.tsx`
- Create: `resources/js/components/admin/question-builder/context-picker.tsx`
- Create: `resources/js/components/admin/question-builder/context-editor.tsx`

**Context:** This is the main SPA — the most complex page in Phase 1.5. It has three panels: tree (left), editor (center), preview (right). All data is loaded via Inertia from the `build()` controller method.

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Paper Header (inline editable: title, course, marks, etc.)  │
├──────────┬──────────────────────────┬───────────────────────┤
│          │                          │                       │
│  Paper   │     Editor Panel         │   Preview Panel       │
│  Tree    │  (section/question/      │   (QuestionRenderer   │
│  (left)  │   context editor)        │    or ContextCard)    │
│          │                          │                       │
│  ~250px  │     flex-1               │    ~350px             │
│          │                          │                       │
└──────────┴──────────────────────────┴───────────────────────┘
```

**paper-tree.tsx:** Renders the hierarchical paper structure. Sections as top-level nodes, questions nested within (with sub-questions). Shared contexts as a separate collapsible group. Uses the same visual style as `blocks.tsx` tree (border-l-2 selection, expand/collapse, type badges).

Tree actions:
- Click node → select it (loads editor)
- "+" button on sections → creates new question via `QuestionController.store` (Inertia POST)
- "+" button on questions → creates sub-question
- "Add Section" button → creates section via `QuestionSectionController.store`
- "Add Context" button → creates context via `QuestionContextController.store`
- Right-click → context menu (delete, move, duplicate)

**Editor panel:** Renders the appropriate editor based on selected node type:
- Section selected → `section-editor.tsx` (label, instruction, required_count, marks)
- Question selected → `question-editor.tsx` with type-specific builder
- Context selected → `context-editor.tsx` (type selector + type-appropriate fields)

**Preview panel:** Renders `QuestionRenderer` for questions, `ContextCard` for contexts, section summary for sections. Updates live as the admin edits.

**State management:** Use Inertia's `router.post/put/delete` for persistence. Local state for the selected node and optimistic UI updates. `router.reload({ only: ['paper'] })` after mutations to refresh the tree.

**paper-header.tsx:** Displays paper metadata (title, course/assessment, year, marks, duration) with inline editing. Saves via `QuestionPaperController.update`.

**context-picker.tsx:** Modal/popover shown when clicking "Link Context" on a question. Lists available contexts from the paper. Select to link via `QuestionContextController.link`.

**context-editor.tsx:** Adapts to context type:
- passage/case_study → Textarea (or Tiptap if available)
- table → Dynamic row/column editor (add/remove rows and columns, cell inputs)
- code_snippet → Textarea + language selector
- diagram/map/graph → URL input + description textarea
- word_bank → Tag input (type + enter to add, click to remove)
- equation_set → Textarea

**Commit:**

```bash
git add -A && git commit -m "add paper builder page with tree sidebar, editor panel, live preview"
```

---

## Task 10: Standalone Question Create/Edit + Question Bank Index

**Files:**
- Rewrite: `resources/js/pages/admin/questions/create.tsx`
- Rewrite: `resources/js/pages/admin/questions/edit.tsx`
- Modify: `resources/js/pages/admin/questions/index.tsx`
- Modify: `app/Http/Controllers/Admin/QuestionController.php` — update `create()` and `edit()` to pass new data

**Context:** Standalone question create/edit pages reuse the same `question-editor.tsx` and type-specific builders from the paper builder, but in a full-page layout with split-pane preview (editor left, QuestionRenderer right).

**Standalone create page layout:**

```
┌────────────────────────────────────────────────────────────┐
│ FormPageLayout (breadcrumbs, title)                        │
├────────────────────────────────┬───────────────────────────┤
│                                │                           │
│  Question Form                 │  Live Preview             │
│  - Source selector             │  (QuestionRenderer)       │
│    (Course / Exam Subject)     │                           │
│  - Type selector               │                           │
│  - question-editor.tsx         │                           │
│  - Topic linker                │                           │
│  - Settings (year, semester,   │                           │
│    difficulty, source, status) │                           │
│                                │                           │
└────────────────────────────────┴───────────────────────────┘
```

**Source selector** — Radio group: "University Course" / "Exam Subject". Shows institution→course cascade for university, assessment_type→exam_subject cascade for exam.

**Index page enhancements:**
- Replace hardcoded `typeStyles` with `QuestionTypeBadge` component
- Add `question_paper_id` filter (standalone vs attached)
- Add `assessment_type` filter
- Add "Question Papers" link/button in the header
- Update sidebar to include "Question Papers" nav item

**Controller updates:**
- `create()` — also pass `assessment_types`, `bloom_levels`
- `edit()` — also load `questionContextLinks`, `questionBlockLinks`, pass assessment types and bloom levels

**Commit:**

```bash
git add -A && git commit -m "rewrite standalone question create/edit with split-pane preview, enhance question bank index"
```

---

## Task 11: Seeders + Admin Sidebar + Final Verification

**Files:**
- Modify: `database/seeders/DatabaseSeeder.php` — add `seedQuestionPapers()` method
- Modify: `resources/js/layouts/admin-layout.tsx` — add Question Papers to sidebar
- Modify: `resources/js/pages/architecture-showcase.tsx` — import QuestionTypeBadge, QuestionRenderer, ContextCard from extracted components

**Seeder data:**

Create 2-3 sample question papers:

1. **CSC 224 Final Exam** (university course) — 2 sections:
   - Section A: "Attempt ALL" (20 MCQ questions, 40 marks)
   - Section B: "Answer 3 of 5" (5 theory/essay questions with sub-questions, 60 marks)
   - 1 shared context (passage)

2. **WAEC Biology 2024** (assessment type) — 2 sections:
   - Section A: "Objective" (50 MCQs)
   - Section B: "Theory" (6 questions, answer 4) with diagram labels, calculations, fill-blank
   - 2 shared contexts (diagram, data table)

3. **JAMB Mathematics 2024** (assessment type) — 1 section:
   - 40 MCQs + 10 numeric entry

Include diverse question types across papers to exercise all 16 builders.

**Admin sidebar:** Add "Question Papers" nav item below "Questions" in the admin sidebar navigation. Use prefix-based active state detection matching existing pattern.

**Final verification:**

```bash
"C:/Users/hp/.config/herd/bin/php.bat" artisan migrate:fresh --seed
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact
npm run build
"C:/Users/hp/.config/herd/bin/php.bat" vendor/bin/pint --dirty --format agent
```

All tests must pass. Frontend must build without errors. Pint must have no issues.

**Commit:**

```bash
git add -A && git commit -m "add question paper seeders, admin sidebar nav, final verification"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | MCQ Migration (options → response_config) | None |
| 2 | ResponseConfigValidator (per-type validation) | Task 1 |
| 3 | QuestionPaper + Section backend | None |
| 4 | QuestionContext backend | Task 3 |
| 5 | QuestionController expansion | Tasks 1, 2 |
| 6 | TypeScript types + component extraction | None |
| 7 | Type-specific builders (all 16) | Task 6 |
| 8 | Question Papers index + create pages | Tasks 3, 6 |
| 9 | Paper builder page (tree + editor + preview) | Tasks 3-7 |
| 10 | Standalone question create/edit + bank index | Tasks 5-7 |
| 11 | Seeders + sidebar + final verification | All above |

## Testing Commands

```bash
# Run all question-related tests
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact --filter=Question

# Run specific test files
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact tests/Feature/Admin/QuestionControllerTest.php
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact tests/Feature/Admin/QuestionPaperControllerTest.php
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact tests/Feature/Admin/QuestionContextControllerTest.php
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact tests/Unit/Rules/ResponseConfigValidatorTest.php

# Full suite
"C:/Users/hp/.config/herd/bin/php.bat" artisan test --compact

# Frontend build
npm run build

# Pint formatting
"C:/Users/hp/.config/herd/bin/php.bat" vendor/bin/pint --dirty --format agent
```
