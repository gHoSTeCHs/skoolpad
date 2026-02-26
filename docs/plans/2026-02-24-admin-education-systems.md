# Admin Education Systems CRUD — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build admin CRUD for managing education systems and all their nested entities (curriculum tiers, education levels, streams, curriculum subjects, grading scales, assessment types, institution types).

**Architecture:** Education System is the top-level entity. The index page lists all systems in a DataTable. The **show page** is the star — a single-page, tabbed detail view (inspired by the architecture-showcase page) that displays and manages all nested entities inline. Each sub-entity (tiers, levels, streams, subjects, assessments) is a tab/section with its own inline DataTable + create/edit modals. Grading scales and institution types get their own top-level pages since they aren't scoped to a single education system.

**Tech Stack:** Laravel 12, Inertia v2, React 19, TypeScript, Tailwind v4, Pest 4, Wayfinder, PostgreSQL UUIDs

**Conventions (from codebase):**
- Controllers: `use Paginates;`, `applySorting()`, `paginated()`, `self::DEFAULT_PER_PAGE`
- Routes: grouped under `middleware(['auth', 'verified', 'staff'])->prefix('admin')->name('admin.')`
- Pages: `AdminLayout` + `PageHeader` + `DataTable` for index, `FormPageLayout` + form partial for create/edit
- Validation: `HasSharedValidationRules` trait with `sharedRules()` + `uniqueRules()`
- Enums: pass via `::toSelectOptions()` to frontend as `{ value, label }[]`
- Models need `scopeSearch()` for search support
- TypeScript types in `resources/js/types/models.ts` and `resources/js/types/enums.ts`
- Wayfinder imports: `import Controller from '@/actions/App/Http/Controllers/Admin/Controller'`
- No single-line comments in code
- Run `vendor/bin/pint --dirty --format agent` before committing

---

## Task 1: TypeScript Types

**Files:**
- Modify: `resources/js/types/enums.ts`
- Modify: `resources/js/types/models.ts`

**Step 1:** Add education system enums to `resources/js/types/enums.ts`:

```ts
export type EducationSystemType = 'national' | 'state' | 'international' | 'exam_board';
export type ScaleType = 'cgpa' | 'gpa' | 'percentage' | 'letter' | 'points' | 'classification';
```

**Step 2:** Add education model types to `resources/js/types/models.ts`:

```ts
import type { EducationSystemType, InstitutionType, OwnershipType, ScaleType } from './enums';

export type EducationSystem = {
    id: string;
    name: string;
    slug: string;
    country_id: string | null;
    system_type: EducationSystemType;
    created_at: string;
    updated_at: string;
    country?: Country;
    curriculum_tiers_count?: number;
    streams_count?: number;
    curriculum_subjects_count?: number;
    assessment_types_count?: number;
};

export type CurriculumTier = {
    id: string;
    education_system_id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_tertiary: boolean;
    created_at: string;
    updated_at: string;
    education_levels_count?: number;
    education_levels?: EducationLevel[];
};

export type EducationLevel = {
    id: string;
    curriculum_tier_id: string;
    name: string;
    display_name: string | null;
    sort_order: number;
    typical_age_min: number | null;
    typical_age_max: number | null;
    created_at: string;
    updated_at: string;
    level_subjects_count?: number;
    curriculum_tier?: { id: string; name: string };
};

export type Stream = {
    id: string;
    education_system_id: string;
    name: string;
    applies_from_tier_id: string;
    created_at: string;
    updated_at: string;
    applies_from_tier?: { id: string; name: string };
};

export type CurriculumSubject = {
    id: string;
    education_system_id: string;
    name: string;
    slug: string;
    discipline_id: string;
    created_at: string;
    updated_at: string;
    discipline?: { id: string; name: string };
    level_subjects_count?: number;
};

export type GradingScale = {
    id: string;
    name: string;
    scale_type: ScaleType;
    scale_min: number | null;
    scale_max: number | null;
    pass_threshold: number | null;
    grade_boundaries: Record<string, unknown>[] | null;
    classification_labels: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    assessment_types_count?: number;
};

export type AssessmentType = {
    id: string;
    education_system_id: string;
    name: string;
    slug: string;
    tier_id: string | null;
    is_exit_exam: boolean;
    is_entrance_exam: boolean;
    grading_scale_id: string | null;
    created_at: string;
    updated_at: string;
    tier?: { id: string; name: string };
    grading_scale?: { id: string; name: string };
};

export type InstitutionTypeModel = {
    id: string;
    country_id: string | null;
    name: string;
    slug: string;
    level_progression: string[] | null;
    credit_system: string | null;
    grading_scale_id: string | null;
    qualification_names: string[] | null;
    created_at: string;
    updated_at: string;
    country?: { id: string; name: string };
    grading_scale?: { id: string; name: string };
};

export type LevelSubject = {
    id: string;
    education_level_id: string;
    curriculum_subject_id: string;
    is_compulsory: boolean;
    stream_id: string | null;
    created_at: string;
    education_level?: { id: string; name: string };
    curriculum_subject?: { id: string; name: string };
    stream?: { id: string; name: string };
};
```

**Step 3:** Commit.

```
git add resources/js/types/enums.ts resources/js/types/models.ts
git commit -m "add TypeScript types for education system entities"
```

---

## Task 2: EducationSystem Model — Add scopeSearch

**Files:**
- Modify: `app/Models/EducationSystem.php`

**Step 1:** Add search scope to EducationSystem model:

```php
use Illuminate\Database\Eloquent\Builder;

public function scopeSearch(Builder $query, string $term): Builder
{
    return $query->where('name', 'ilike', "%{$term}%");
}
```

**Step 2:** Run existing tests to confirm nothing breaks:

```bash
php artisan test --compact --filter=GlobalEducationModelTest
```

**Step 3:** Commit.

```
git add app/Models/EducationSystem.php
git commit -m "add scopeSearch to EducationSystem model"
```

---

## Task 3: EducationSystem Controller + Form Requests + Routes

**Files:**
- Create: `app/Http/Controllers/Admin/EducationSystemController.php`
- Create: `app/Http/Requests/Admin/StoreEducationSystemRequest.php`
- Create: `app/Http/Requests/Admin/UpdateEducationSystemRequest.php`
- Modify: `routes/web.php`

**Step 1:** Create controller via artisan:

```bash
php artisan make:controller Admin/EducationSystemController --no-interaction
```

**Step 2:** Implement the controller with index, create, store, show, edit, update methods.

The controller should:
- `index`: Paginated list with `withCount('curriculumTiers', 'streams', 'curriculumSubjects', 'assessmentTypes')`, search, filter by `system_type`, sorting on `name`, `system_type`, counts
- `create`: Pass `systemTypes` (enum select options), `countries`
- `store`: Validate, auto-generate slug from name if empty, create, redirect
- `show`: Load education system with all nested relationships eagerly loaded (tiers with levels, streams, subjects with discipline, assessments with tier + grading scale). This is the detail/management page
- `edit`: Pass system + `systemTypes`, `countries`
- `update`: Validate, update, redirect

Pattern reference: `app/Http/Controllers/Admin/InstitutionController.php`

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\EducationSystemType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEducationSystemRequest;
use App\Http\Requests\Admin\UpdateEducationSystemRequest;
use App\Models\Country;
use App\Models\EducationSystem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EducationSystemController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $systems = EducationSystem::query()
            ->with('country:id,name,code')
            ->withCount(['curriculumTiers', 'streams', 'curriculumSubjects', 'assessmentTypes'])
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('system_type'), fn ($q) => $q->where('system_type', $request->string('system_type')))
            ->tap(fn ($query) => $this->applySorting($query, $request, [
                'name', 'system_type', 'curriculum_tiers_count', 'curriculum_subjects_count',
            ]))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $systemsWithLabels = $systems->through(fn ($system) => array_merge(
            $system->toArray(),
            ['system_type_label' => $system->system_type->label()]
        ));

        return Inertia::render('admin/education-systems/index', [
            'educationSystems' => $this->paginated($systemsWithLabels),
            'filters' => $request->only(['search', 'system_type', 'sort', 'direction']),
            'systemTypes' => EducationSystemType::toSelectOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/education-systems/create', [
            'systemTypes' => EducationSystemType::toSelectOptions(),
            'countries' => Country::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreEducationSystemRequest $request): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        EducationSystem::create($data);

        return to_route('admin.education-systems.index')->with('success', 'Education system created successfully.');
    }

    public function show(EducationSystem $educationSystem): Response
    {
        $educationSystem->load([
            'country:id,name,code',
            'curriculumTiers' => fn ($q) => $q->orderBy('sort_order')->withCount('educationLevels'),
            'curriculumTiers.educationLevels' => fn ($q) => $q->orderBy('sort_order'),
            'streams.appliesFromTier:id,name',
            'curriculumSubjects' => fn ($q) => $q->orderBy('name'),
            'curriculumSubjects.discipline:id,name',
            'assessmentTypes' => fn ($q) => $q->orderBy('name'),
            'assessmentTypes.tier:id,name',
            'assessmentTypes.gradingScale:id,name',
        ]);

        return Inertia::render('admin/education-systems/show', [
            'educationSystem' => $educationSystem,
        ]);
    }

    public function edit(EducationSystem $educationSystem): Response
    {
        return Inertia::render('admin/education-systems/edit', [
            'educationSystem' => $educationSystem,
            'systemTypes' => EducationSystemType::toSelectOptions(),
            'countries' => Country::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function update(UpdateEducationSystemRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $educationSystem->update($request->validated());

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Education system updated successfully.');
    }
}
```

**Step 3:** Create form requests.

`StoreEducationSystemRequest`:
```php
<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\EducationSystemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreEducationSystemRequest extends FormRequest
{
    use HasSharedValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    protected function sharedRules(): array
    {
        return [
            'country_id' => ['nullable', 'uuid', 'exists:countries,id'],
            'system_type' => ['required', new Enum(EducationSystemType::class)],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForStore('education_systems')],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', $this->uniqueForStore('education_systems')],
        ];
    }
}
```

`UpdateEducationSystemRequest`:
```php
<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\EducationSystemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateEducationSystemRequest extends FormRequest
{
    use HasSharedValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    protected function sharedRules(): array
    {
        return [
            'country_id' => ['nullable', 'uuid', 'exists:countries,id'],
            'system_type' => ['required', new Enum(EducationSystemType::class)],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForUpdate('education_systems', 'education_system')],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', $this->uniqueForUpdate('education_systems', 'education_system')],
        ];
    }
}
```

**Step 4:** Add routes to `routes/web.php` inside the admin group. Add resource route + show:

```php
use App\Http\Controllers\Admin\EducationSystemController;

Route::resource('education-systems', EducationSystemController::class)->except(['destroy']);
```

**Step 5:** Run pint, then commit.

```bash
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/Admin/EducationSystemController.php \
    app/Http/Requests/Admin/StoreEducationSystemRequest.php \
    app/Http/Requests/Admin/UpdateEducationSystemRequest.php \
    routes/web.php
git commit -m "education system controller, form requests, and routes"
```

---

## Task 4: Education Systems Index Page (Frontend)

**Files:**
- Create: `resources/js/pages/admin/education-systems/index.tsx`

**Step 1:** Build the index page following the exact pattern from `admin/institutions/index.tsx`:
- DataTable with columns: Name (sortable, shows country flag/code if present), Type (sortable, uses label), Tiers, Subjects, Assessments (count columns)
- SearchInput + system_type filter dropdown
- RowActions with edit + "View Details" linking to show page
- Wayfinder import for `EducationSystemController`

**Step 2:** Run `npm run build` to verify the page compiles.

**Step 3:** Commit.

```
git add resources/js/pages/admin/education-systems/index.tsx
git commit -m "education systems index page with DataTable"
```

---

## Task 5: Education Systems Create/Edit Pages (Frontend)

**Files:**
- Create: `resources/js/pages/admin/education-systems/create.tsx`
- Create: `resources/js/pages/admin/education-systems/edit.tsx`
- Create: `resources/js/pages/admin/education-systems/partials/education-system-form.tsx`

**Step 1:** Create the shared form partial with fields: name, slug (auto-generated via `useSlug`), system_type (Select from enum options), country_id (Select from countries list, nullable).

Pattern reference: `admin/disciplines/partials/discipline-form.tsx`

**Step 2:** Create `create.tsx` and `edit.tsx` pages using `FormPageLayout`.

**Step 3:** Run `npm run build`.

**Step 4:** Commit.

```
git add resources/js/pages/admin/education-systems/
git commit -m "education systems create and edit pages"
```

---

## Task 6: Nested Entity Controllers — Curriculum Tiers + Education Levels

These are managed inline on the education system show page, but need API-style store/update/destroy endpoints.

**Files:**
- Create: `app/Http/Controllers/Admin/CurriculumTierController.php`
- Create: `app/Http/Controllers/Admin/EducationLevelController.php`
- Create: `app/Http/Requests/Admin/StoreCurriculumTierRequest.php`
- Create: `app/Http/Requests/Admin/UpdateCurriculumTierRequest.php`
- Create: `app/Http/Requests/Admin/StoreEducationLevelRequest.php`
- Create: `app/Http/Requests/Admin/UpdateEducationLevelRequest.php`
- Modify: `routes/web.php`

**Step 1:** Create `CurriculumTierController` with store, update, destroy methods.
- All redirect back to `admin.education-systems.show`
- `store`: Validate, auto-slug, create under the given education system
- `update`: Validate, update
- `destroy`: Delete (cascade will remove levels)

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCurriculumTierRequest;
use App\Http\Requests\Admin\UpdateCurriculumTierRequest;
use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class CurriculumTierController extends Controller
{
    public function store(StoreCurriculumTierRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $data = $request->validated();
        $data['education_system_id'] = $educationSystem->id;
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        CurriculumTier::create($data);

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Curriculum tier created.');
    }

    public function update(UpdateCurriculumTierRequest $request, CurriculumTier $curriculumTier): RedirectResponse
    {
        $curriculumTier->update($request->validated());

        return to_route('admin.education-systems.show', $curriculumTier->education_system_id)->with('success', 'Curriculum tier updated.');
    }

    public function destroy(CurriculumTier $curriculumTier): RedirectResponse
    {
        $systemId = $curriculumTier->education_system_id;
        $curriculumTier->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Curriculum tier deleted.');
    }
}
```

**Step 2:** Create `EducationLevelController` with same pattern, scoped under a curriculum tier.

**Step 3:** Create form request classes for both. CurriculumTier requires: name, slug (nullable, unique per system), sort_order, is_tertiary. EducationLevel requires: name, display_name (nullable), sort_order, typical_age_min (nullable), typical_age_max (nullable).

**Step 4:** Add routes:

```php
Route::post('education-systems/{education_system}/tiers', [CurriculumTierController::class, 'store'])->name('curriculum-tiers.store');
Route::put('curriculum-tiers/{curriculum_tier}', [CurriculumTierController::class, 'update'])->name('curriculum-tiers.update');
Route::delete('curriculum-tiers/{curriculum_tier}', [CurriculumTierController::class, 'destroy'])->name('curriculum-tiers.destroy');

Route::post('curriculum-tiers/{curriculum_tier}/levels', [EducationLevelController::class, 'store'])->name('education-levels.store');
Route::put('education-levels/{education_level}', [EducationLevelController::class, 'update'])->name('education-levels.update');
Route::delete('education-levels/{education_level}', [EducationLevelController::class, 'destroy'])->name('education-levels.destroy');
```

**Step 5:** Pint + commit.

```
git commit -m "curriculum tier and education level controllers with form requests"
```

---

## Task 7: Nested Entity Controllers — Streams, Subjects, Assessments

Same pattern as Task 6.

**Files:**
- Create: `app/Http/Controllers/Admin/StreamController.php` (store under system, update, destroy)
- Create: `app/Http/Controllers/Admin/CurriculumSubjectController.php` (store under system, update, destroy)
- Create: `app/Http/Controllers/Admin/AssessmentTypeController.php` (store under system, update, destroy)
- Create corresponding form request pairs (6 files)
- Modify: `routes/web.php`

**Step 1:** Stream controller — store requires: name, applies_from_tier_id (must be a tier of the same system)
**Step 2:** CurriculumSubject controller — store requires: name, slug (auto), discipline_id
**Step 3:** AssessmentType controller — store requires: name, slug (auto), tier_id (nullable), is_exit_exam, is_entrance_exam, grading_scale_id (nullable)

**Step 4:** Routes:

```php
Route::post('education-systems/{education_system}/streams', [StreamController::class, 'store'])->name('streams.store');
Route::put('streams/{stream}', [StreamController::class, 'update'])->name('streams.update');
Route::delete('streams/{stream}', [StreamController::class, 'destroy'])->name('streams.destroy');

Route::post('education-systems/{education_system}/subjects', [CurriculumSubjectController::class, 'store'])->name('curriculum-subjects.store');
Route::put('curriculum-subjects/{curriculum_subject}', [CurriculumSubjectController::class, 'update'])->name('curriculum-subjects.update');
Route::delete('curriculum-subjects/{curriculum_subject}', [CurriculumSubjectController::class, 'destroy'])->name('curriculum-subjects.destroy');

Route::post('education-systems/{education_system}/assessments', [AssessmentTypeController::class, 'store'])->name('assessment-types.store');
Route::put('assessment-types/{assessment_type}', [AssessmentTypeController::class, 'update'])->name('assessment-types.update');
Route::delete('assessment-types/{assessment_type}', [AssessmentTypeController::class, 'destroy'])->name('assessment-types.destroy');
```

**Step 5:** Pint + commit.

```
git commit -m "stream, curriculum subject, and assessment type controllers"
```

---

## Task 8: Education System Show Page (Frontend — The Main Event)

This is the richest page — a tabbed detail view inspired by the architecture-showcase. Each tab manages one entity type inline.

**Files:**
- Create: `resources/js/pages/admin/education-systems/show.tsx`
- Create: `resources/js/pages/admin/education-systems/partials/tiers-tab.tsx`
- Create: `resources/js/pages/admin/education-systems/partials/streams-tab.tsx`
- Create: `resources/js/pages/admin/education-systems/partials/subjects-tab.tsx`
- Create: `resources/js/pages/admin/education-systems/partials/assessments-tab.tsx`

**Step 1:** Build `show.tsx` — the container page:
- Page header with system name, type badge, country info, edit button
- Stats bar showing counts (tiers, levels, streams, subjects, assessments)
- Tab navigation using a simple state-driven tab switcher (no routing — all data is already loaded)
- Tabs: Structure (tiers + levels), Streams, Subjects, Assessments
- Each tab renders a partial component

Use design cues from the architecture-showcase:
- `SectionLabel` style headers with gradient line
- Cards with `rounded-[var(--card-radius)] border border-border bg-card` styling
- Stats in grid with `text-[22px] font-bold text-primary` for values
- `font-display` for headings, `font-body` for labels

**Step 2:** Build `tiers-tab.tsx`:
- Displays each tier as an expandable card (like the TreeNode pattern from showcase)
- Each tier shows its education levels nested underneath
- "Add Tier" button opens a Dialog/Sheet with the tier form (name, slug, sort_order, is_tertiary toggle)
- Each tier row has edit/delete actions
- Each level row has edit/delete actions
- "Add Level" button per tier

Use `useForm` from Inertia for each inline form. Submit via `form.post()` / `form.put()` to the nested controllers.

**Step 3:** Build `streams-tab.tsx`:
- Simple DataTable: name, applies_from_tier (shown as tier name)
- "Add Stream" dialog with name + tier selector (dropdown of this system's tiers)

**Step 4:** Build `subjects-tab.tsx`:
- DataTable: name, slug, discipline
- "Add Subject" dialog with name, slug, discipline selector

**Step 5:** Build `assessments-tab.tsx`:
- DataTable: name, slug, tier (optional), exit exam / entrance exam badges, grading scale
- "Add Assessment" dialog

**Step 6:** Run `npm run build`.

**Step 7:** Commit.

```
git commit -m "education system show page with tabbed management for all nested entities"
```

---

## Task 9: Sidebar Navigation Update

**Files:**
- Modify: `resources/js/components/admin-sidebar.tsx`

**Step 1:** Add "Education Systems" nav item to the sidebar. Place it in a new group or in the "Institutions" group:

```tsx
import { Globe } from 'lucide-react';
import EducationSystemController from '@/actions/App/Http/Controllers/Admin/EducationSystemController';

// Add to the "Institutions" group:
{ title: 'Education Systems', href: EducationSystemController.index.url(), icon: Globe },
```

**Step 2:** Commit.

```
git commit -m "add education systems to admin sidebar"
```

---

## Task 10: Feature Tests — Controller Tests

**Files:**
- Create: `tests/Feature/Admin/EducationSystemControllerTest.php`

**Step 1:** Write tests covering:
- `index`: renders page, search works, system_type filter works, sorting works
- `create`: renders form with enum options
- `store`: creates system, validates required fields, validates unique slug
- `show`: renders detail page with all nested data
- `edit`: renders form with existing data
- `update`: updates system, validates

Pattern: create a staff user (SuperAdmin or Admin role) and `actingAs()` for all tests. Use `RefreshDatabase` trait.

Test structure:
```php
<?php

use App\Enums\EducationSystemType;
use App\Enums\UserRole;
use App\Models\Country;
use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
});

test('education systems index renders', function () {
    EducationSystem::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/education-systems/index')
            ->has('educationSystems.data', 1)
        );
});

test('education systems index filters by system type', function () {
    EducationSystem::factory()->create(['system_type' => EducationSystemType::National]);
    EducationSystem::factory()->create(['system_type' => EducationSystemType::ExamBoard]);

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.index', ['system_type' => 'national']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('educationSystems.data', 1));
});

test('education systems store creates a system', function () {
    $country = Country::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [
            'name' => 'Test System',
            'slug' => 'test-system',
            'system_type' => 'national',
            'country_id' => $country->id,
        ])
        ->assertRedirect(route('admin.education-systems.index'));

    expect(EducationSystem::where('slug', 'test-system')->exists())->toBeTrue();
});

test('education systems store validates unique name', function () {
    EducationSystem::factory()->create(['name' => 'Existing']);

    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [
            'name' => 'Existing',
            'system_type' => 'national',
        ])
        ->assertSessionHasErrors('name');
});

test('education systems show loads all nested data', function () {
    $system = EducationSystem::factory()->create();
    CurriculumTier::factory()->create(['education_system_id' => $system->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.show', $system))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/education-systems/show')
            ->has('educationSystem.curriculum_tiers', 1)
        );
});

test('education systems update modifies the system', function () {
    $system = EducationSystem::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.education-systems.update', $system), [
            'name' => 'Updated Name',
            'slug' => $system->slug,
            'system_type' => $system->system_type->value,
        ])
        ->assertRedirect(route('admin.education-systems.show', $system));

    expect($system->fresh()->name)->toBe('Updated Name');
});
```

**Step 2:** Run tests:

```bash
php artisan test --compact --filter=EducationSystemControllerTest
```

**Step 3:** Commit.

```
git commit -m "feature tests for education system controller"
```

---

## Task 11: Feature Tests — Nested Entity Controllers

**Files:**
- Create: `tests/Feature/Admin/CurriculumTierControllerTest.php`
- Create: `tests/Feature/Admin/EducationLevelControllerTest.php`
- Create: `tests/Feature/Admin/StreamControllerTest.php`
- Create: `tests/Feature/Admin/CurriculumSubjectControllerTest.php`
- Create: `tests/Feature/Admin/AssessmentTypeControllerTest.php`

**Step 1:** For each nested controller, test:
- `store`: creates entity, redirects back to show page
- `update`: modifies entity
- `destroy`: deletes entity
- Validation: required fields, unique constraints where applicable

**Step 2:** Run all tests:

```bash
php artisan test --compact --filter=Admin
```

**Step 3:** Commit.

```
git commit -m "feature tests for nested education entity controllers"
```

---

## Task 12: Grading Scales CRUD (Top-Level)

Grading scales are not scoped to a single education system, so they get their own top-level admin page.

**Files:**
- Create: `app/Http/Controllers/Admin/GradingScaleController.php` (index, create, store, edit, update)
- Create: `app/Http/Requests/Admin/StoreGradingScaleRequest.php`
- Create: `app/Http/Requests/Admin/UpdateGradingScaleRequest.php`
- Create: `resources/js/pages/admin/grading-scales/index.tsx`
- Create: `resources/js/pages/admin/grading-scales/create.tsx`
- Create: `resources/js/pages/admin/grading-scales/edit.tsx`
- Create: `resources/js/pages/admin/grading-scales/partials/grading-scale-form.tsx`
- Modify: `routes/web.php`
- Modify: `resources/js/components/admin-sidebar.tsx`
- Create: `tests/Feature/Admin/GradingScaleControllerTest.php`

**Step 1:** Controller with index (paginated, search, filter by scale_type), create, store, edit, update.

**Step 2:** Form with fields: name, scale_type (Select from enum), scale_min, scale_max, pass_threshold, grade_boundaries (JSON textarea), classification_labels (JSON textarea for CGPA scales).

**Step 3:** Route: `Route::resource('grading-scales', GradingScaleController::class)->except(['show', 'destroy']);`

**Step 4:** Add GradingScale model scopeSearch.

**Step 5:** Sidebar: Add "Grading Scales" item to the "Institutions" group.

**Step 6:** Tests + pint + commit.

```
git commit -m "grading scales CRUD with admin UI and tests"
```

---

## Task 13: Final Integration — Run Full Test Suite

**Step 1:** Run pint on all dirty files:

```bash
vendor/bin/pint --dirty --format agent
```

**Step 2:** Run the full test suite:

```bash
php artisan test --compact
```

**Step 3:** Fix any failures.

**Step 4:** Run `npm run build` to ensure frontend compiles cleanly.

**Step 5:** Final commit if any fixes were needed.

```
git commit -m "fix: resolve any integration issues from full test run"
```

---

## File Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Controllers | 7 | 0 |
| Form Requests | 12 | 0 |
| Frontend Pages | ~12 | 0 |
| Types | 0 | 2 |
| Models | 0 | 1 |
| Sidebar | 0 | 1 |
| Routes | 0 | 1 |
| Tests | 6 | 0 |
| **Total** | **~37** | **5** |
