# CGPA Simulator — Detailed Mode

## Overview

Add a "detailed mode" to the CGPA Simulator that lets students enter grades semester-by-semester using collapsible accordion panels. The system pre-generates semester shells from the institution's level progression (e.g., 100L–400L, First/Second per level) and students fill in courses and grades per semester. CGPA accumulates across all semesters with a live GPA trend chart.

Quick mode remains unchanged. Detailed mode is a separate calculator with a different data shape — no shared baseline fields.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Semester structure | Hybrid: pre-generated from level progression, add/remove allowed | Covers 90% of students automatically; handles extra years and edge cases |
| CGPA calculation | Semesters replace baseline — no Current CGPA/Credits fields | Avoids two sources of truth; semester data IS the truth |
| Mode relationship | Per-simulation — each saved simulation is quick or detailed | Clean data separation; no migration between modes needed |
| UI pattern | Accordion panels — collapsible semester blocks | Compact overview with expand-for-detail; works on mobile |
| Past vs future distinction | Visual only — filled semesters show as "completed" | No separate data model; implicit from whether grades exist |

## Assumptions

- Pre-generation assumes **2 semesters per level** (First Semester, Second Semester). This matches all current Nigerian institution types (university, polytechnic, college of education).
- Semester labels in `SemesterData` use concise format: `"First"`, `"Second"`. The `Semester` enum backing values from `enrolledCourses` (via `InstitutionCourse.semester`) are `"first"`, `"second"`, `"both"`, or `null`. The import mapping is exhaustive: `"first"` → `"First"`, `"second"` → `"Second"`, `"both"` → matches both First and Second panels (level-only match), `null` → excluded from import. If new enum values are added (e.g., `"summer"`), they must be added to this mapping or they will be silently excluded from import. Accordion headers combine these as `"100L — First Semester"` (display-only concatenation), while the stored value stays `"First"` so chart labels remain compact (`"100L First"`).
- The `calculate` and `reverseCalculate` JSON endpoints are **not used** in detailed mode. All computation happens client-side via `calculateCumulativeCgpa`. No changes to these endpoints are needed.
- The existing **max 10 simulations** limit counts both modes combined. A student using both quick and detailed modes shares the same pool of 10 slots.
- **Duplicate course imports are the student's responsibility.** Courses with `semester: "both"` can be imported into either First or Second semester for a given level. If imported into both, credit counts double. This is acceptable for a what-if simulator — the student controls their hypothetical entries.
- **Removing a semester is not undoable.** The confirmation dialog is the only safeguard. This is acceptable for a simulator where data can be re-entered.

## User Flow

1. Student clicks "New Simulation"
2. Mode selector appears: Quick / Detailed
3. Student picks "Detailed"
4. System generates semester shells from `levelProgression` (e.g., 8 panels for a 4-year university: 100L First Semester, 100L Second Semester, ..., 400L Second Semester). The first semester panel is auto-expanded with a hint: "Add courses to get started"
5. Student expands a semester, adds courses (manually or via "Import Enrolled" filtered by level/semester), selects grades
6. Cumulative CGPA, classification, and GPA trend chart update live as grades are entered across any semester
7. Student names and saves the simulation
8. Loading a saved detailed simulation merges saved semester data with the full level progression shells — all semesters are visible, with saved courses pre-filled into their matching panels

### Mode Switching

If a student starts entering data in one mode and switches to the other via the mode selector, entered data is discarded with a confirmation dialog. The message distinguishes between unsaved and saved state: if editing a saved simulation, "Switching modes will start a new simulation. Your saved simulation is not affected. Continue?" Otherwise, "Switching modes will clear your current entries. Continue?" This avoids complex migration between incompatible data shapes.

## Page Layout

Two-column grid (unchanged):
- **Left column:** Mode-dependent calculator (quick or detailed)
- **Right column:** Saved simulations list + reverse calculator (shared across modes)

Header gains a mode badge in detailed mode: "Grade Calculator — Detailed".

Mode toggle only appears when creating a new simulation. Loading a saved simulation auto-selects its mode. When mode is `null` (before selection), the right column shows the saved simulations list. The reverse calculator is hidden until a mode is selected, since it requires CGPA/credit inputs that don't exist yet.

## Detailed Calculator — Accordion Structure

```
Simulation Name: [________________]

▼ 100L — First Semester          GPA: 3.80  |  15 credits  [●]  [×]
  ┌─────────┬─────────────────┬───────┬───────┬───┐
  │ Code    │ Title           │ Units │ Grade │ × │
  ├─────────┼─────────────────┼───────┼───────┼───┤
  │ GST 101 │ Use of English  │ 2     │ A (5) │ × │
  │ CSC 101 │ Intro to CS     │ 3     │ B (4) │ × │
  └─────────┴─────────────────┴───────┴───────┴───┘
  [+ Add Course]  [Import Enrolled]

▶ 100L — Second Semester         GPA: —     |  0 credits   [○]
▶ 200L — First Semester          GPA: —     |  0 credits   [○]
▶ 200L — Second Semester         GPA: —     |  0 credits   [○]
▶ 300L — First Semester          GPA: —     |  0 credits   [○]
▶ 300L — Second Semester         GPA: —     |  0 credits   [○]
▶ 400L — First Semester          GPA: —     |  0 credits   [○]
▶ 400L — Second Semester         GPA: —     |  0 credits   [○]

[+ Add Semester]

                                              [Save Simulation]
```

### Accordion Header

Each header displays:
- Level label + semester label (e.g., "100L — First Semester")
- Computed GPA for that semester (or "—" if no graded courses)
- Total credits for that semester
- Status indicator: green dot (all courses graded), amber dot (partially filled), gray dot (empty)

### Accordion Body

Reuses the existing `CourseGradeRow` component — same grid layout.

Per-semester actions:
- **Add Course** — appends an empty row
- **Import Enrolled** — filters `enrolledCourses` by matching `level` and `semester` metadata (using the mapping from Assumptions section), imports only courses for that specific semester. Enrolled courses with `null` level or semester are excluded from import. Courses with `semester: "both"` (full-year courses) match on level only — they are importable into either First or Second semester panel for that level. No cross-semester deduplication is enforced (see Assumptions).
- **Remove course** — same as quick mode (visible on mobile, hover-reveal on desktop)

### Add Semester

Button at the bottom of the accordion list. Opens a small dialog/popover:
- **Level** dropdown: options from `levelProgression` + "Extra Year 1", "Extra Year 2" (up to 2 extra years)
- **Semester** dropdown: "First", "Second"
- Creates a new empty semester panel, inserted in level/semester order (not appended to the end)
- Extra Year levels store as `"Extra Year 1"` and `"Extra Year 2"` in `SemesterData.level`. They sort after all regular `levelProgression` entries, ordered numerically (Extra Year 1 before Extra Year 2), then by semester ordinal (First before Second) within each extra year
- Already-existing level+semester combinations are disabled in the dropdowns to prevent duplicates
- Two extra years (4 possible panels) covers the common edge cases. Students needing more can re-run simulations

Each semester has a remove button in its header (with confirmation dialog if it contains courses). Pre-generated semesters from level progression can be removed. At least one semester must remain — the remove button is hidden when only one semester exists.

## Results & Calculation

### Results Panel (Detailed Mode)

Adapts based on mode:
- Header label changes to **"Cumulative CGPA"** (not "Projected CGPA")
- Classification badge and progress bar unchanged
- The quick-mode footer (Current | Change | Projected) is **replaced entirely** — those values are meaningless when there is no baseline. In its place, show a three-column stats row: **Cumulative CGPA | Total Credits | Semesters with Data** (count of semesters that have at least one fully-graded course — matching the `semestersWithData` return from `calculateCumulativeCgpa`)

### CGPA Calculation

Cumulative CGPA = `sum(quality_points across all semesters) / sum(credits across all semesters)`

Per-semester GPA computed via existing `calculateGpa()`. Cumulative aggregation is a new `calculateCumulativeCgpa()` function in `cgpa-calculator.ts`.

### Semester GPA Chart

Renders automatically when any semester has graded courses. Bar per semester showing GPA. Existing component — two fixes needed:

1. **`hsl()` bug:** CSS custom properties (`--badge-primary-fg`, `--border`, `--card`) return raw hex values (e.g., `#0C7B56`), not HSL channel values. Remove ALL `hsl()` wrappers in the component — `colors.primary`, `colors.grid`, `colors.card`, and `colors.border` are all used with `hsl()` wrappers in 4 places (tooltip style + CartesianGrid stroke + Bar fill). Use values directly. Verify the exact count against the current file at implementation time — the component may have changed.
2. **Theme reactivity:** `useChartColors` reads CSS vars once on mount (empty deps array). Import `useAppearance` from `@/hooks/use-appearance` and add its `resolvedAppearance` value as a `useEffect` dependency — the hook already reacts to theme changes via `useSyncExternalStore`, so the effect re-runs and re-reads CSS vars automatically when the user switches themes. No `MutationObserver` needed.

### Reverse Calculator

Works in detailed mode by deriving cumulative CGPA and total credits from semester data (instead of manual input fields). No prop changes needed — parent computes and passes derived values. Note: in detailed mode, the `currentCgpa` prop represents the cumulative CGPA from all semesters, and `currentCredits` is the total credits across all semesters.

## Save/Load & Data Model

### No Migration Needed

All required columns already exist:
- `mode` (string: 'quick' | 'detailed')
- `semester_data` (JSON, nullable)
- `projected_grades` (JSON)
- `current_cgpa`, `current_credit_hours` (numeric)

### Save Payload (Detailed Mode)

```json
{
  "name": "Full Transcript Sim",
  "mode": "detailed",
  "current_cgpa": 0,
  "current_credit_hours": 0,
  "semester_data": [
    {
      "level": "100L",
      "semester": "First",
      "courses": [
        { "course_code": "GST 101", "course_title": "Use of English", "credit_units": 2, "grade": "A" },
        { "course_code": "CSC 101", "course_title": "Intro to CS", "credit_units": 3, "grade": "B" }
      ]
    }
  ],
  "target_cgpa": null
}
```

Note: detailed mode does **not** send `projected_grades` — the server derives it from `semester_data` (see Backend section).

### Save Payload Rules

- **`semester_data`** is the single source of truth for detailed mode. The frontend filters it before submission via a `prepareSemesterDataForSubmission(semesters)` utility function in `cgpa-calculator.ts`. This function performs two passes: (1) within each semester, remove individual courses that are incomplete — a course is incomplete if it lacks any of `course_code`, `credit_units > 0`, or `grade` (matching the same "fully-graded" definition used by the save button guard), then (2) remove any semester whose filtered course list is empty. This avoids the `semester_data.*.courses.*.course_code: required`, `semester_data.*.courses.*.credit_units: required|min:1`, `semester_data.*.courses.*.grade: required`, and `semester_data.*.courses: min:1` validation failures.
- **`projected_grades`** is derived server-side. When `mode === 'detailed'`, the controller flattens `semester_data[*].courses` into `projected_grades` before persisting. This eliminates the dual-source-of-truth risk. The frontend sends `projected_grades` as an empty array `[]` for detailed mode — the server ignores it and overwrites with the flattened value. The FormRequest conditionally relaxes the `projected_grades` `min:1` rule for detailed mode (see Validation section).
- **`current_cgpa`** and **`current_credit_hours`** are zeroed (not used in detailed mode, but columns are non-nullable). No FormRequest changes needed — `min:0` already exists in the rules. The server-side `calculateProjectedCgpa` computes `oldQualityPoints = currentCgpa * currentCredits` which equals `0 * 0 = 0`, so the result is purely from `projected_grades` — matching the frontend's cumulative calculation.
- **Save button is disabled** until at least one semester has at least one fully-graded course (course_code + credit_units + grade all filled). This is a UX guard only — the server-side derivation + validation is the actual enforcement.

### Load Behavior

`mode` field determines which calculator renders. Quick simulations load the flat calculator. Detailed simulations merge saved `semester_data` with the full level progression shell set: every level+semester combination from `levelProgression` is generated, then saved courses are matched into their corresponding panels by `level` + `semester` key. Semesters that exist in `semester_data` but not in `levelProgression` (e.g., "Extra Year") are preserved and appended after regular levels. The result is all semesters visible with saved data pre-filled — the student can continue filling in empty semesters without manually re-adding them.

### Simulation List

Each saved simulation card shows a small badge: "Quick" or "Detailed".

### Validation

Existing `semester_data.*` nested rules already validate the structure. The FormRequest needs mode-conditional rules to enforce data integrity:

- `semester_data` → **replace** `['nullable', 'array']` with `[Rule::requiredIf($this->input('mode') === 'detailed'), Rule::prohibitedIf($this->input('mode') === 'quick'), 'array']`. The `nullable` rule **must be removed** — it takes precedence over `required_if` in Laravel validation, which would allow `semester_data: null` for detailed simulations.
- `projected_grades` → **replace** `['required', 'array', 'min:1']` with mode-conditional rules: `$this->input('mode') === 'detailed' ? ['present', 'array'] : ['required', 'array', 'min:1']`. Detailed mode sends an empty array (server derives the real value from `semester_data`); quick mode still requires at least one entry. **`present` instead of `required`** — Laravel's `required` rule rejects empty arrays (`count($value) < 1`), so `['required', 'array', 'min:0']` would still fail for `[]`. The `present` rule only checks that the field exists in the request, allowing empty arrays through.

`current_cgpa` and `current_credit_hours` already allow `min:0`. Empty semesters and ungraded courses are filtered client-side before submission.

## Components & File Structure

### New Components

| Component | Purpose |
|-----------|---------|
| `partials/mode-selector.tsx` | Quick/Detailed toggle for new simulations |
| `partials/quick-calculator.tsx` | Extracted from current `index.tsx` — existing quick mode logic. Note: current `handleSave` hardcodes `mode: 'quick'`; this stays correct after extraction. |
| `partials/detailed-calculator.tsx` | Accordion container, semester state management, cumulative computation, save handler. Uses shadcn/ui `Accordion` (Radix) for built-in keyboard accessibility (Enter/Space toggle, arrow key navigation between panels). **Prerequisite:** run `npx shadcn@latest add accordion` — the component does not exist yet. |
| `partials/semester-panel.tsx` | Single accordion item: header + course grid body |
| `partials/add-semester-dialog.tsx` | Level/semester picker for adding custom semesters |

### Modified Components

| Component | Changes |
|-----------|---------|
| `index.tsx` | Add mode state (`'quick' \| 'detailed' \| null`), conditionally render quick calculator, detailed calculator, or mode selector only (when mode is `null` — new simulation before mode is chosen) |
| `results-panel.tsx` | Accept `mode` prop, adapt labels for detailed mode |
| `semester-gpa-chart.tsx` | Fix `hsl()` bug, re-read CSS vars on theme change |
| `simulation-list.tsx` | Add mode badge to each card |

### Reused As-Is

| Component | Notes |
|-----------|-------|
| `course-grade-row.tsx` | Same component used inside semester panels |
| `reverse-calculator.tsx` | Receives derived CGPA/credits from parent |

### Client Calculator

Add to `cgpa-calculator.ts`:

```typescript
function calculateCumulativeCgpa(
    semesters: SemesterData[],
    gradeBoundaries: GradeBoundary[],
    scaleMax: number,
): { cumulativeCgpa: number; totalCredits: number; totalQualityPoints: number; semestersWithData: number }
```

Iterates all semesters, sums quality points and credits, returns cumulative CGPA capped at `scaleMax`. A semester counts toward `semestersWithData` if it has at least one course with a valid grade (i.e., `gradeToPoint` returns non-null). When all semesters are empty (zero total credits), returns `cumulativeCgpa: 0`, `totalCredits: 0`, `totalQualityPoints: 0`, `semestersWithData: 0`.

Also add a `prepareSemesterDataForSubmission(semesters)` utility that performs the two-pass client-side filtering (remove incomplete courses — missing `course_code`, `credit_units > 0`, or `grade` — then remove empty semesters) before save. This must be a named, reusable function — not inline in the save handler — because the filtering logic is load-bearing for validation.

### Backend

- No new migrations, models, or endpoints
- **Controller change** (store + update): when `mode === 'detailed'`, flatten `semester_data[*].courses` into `projected_grades` before passing to `calculateProjectedCgpa` and persisting. This is ~3 lines using `collect($validated['semester_data'])->flatMap(fn ($s) => $s['courses'])->values()->all()`. The flattened array replaces whatever the frontend sent in `projected_grades`.
- **FormRequest changes** (both Store and Update):
  - `semester_data` → replace `['nullable', 'array']` with mode-conditional `required_if` / `prohibited_if` (see Validation section)
  - `projected_grades` → use `present` + `array` for detailed mode, `required` + `array` + `min:1` for quick mode (see Validation section)

## Testing

### Feature Tests
- Save a detailed simulation with multi-semester data → verify `projected_grades` is server-derived (flattened from `semester_data`)
- Save a detailed simulation → verify `projected_cgpa` is computed from flattened courses
- Load a detailed simulation and verify semester_data in response
- Mode badge present in simulation list response
- Validation: semester_data required when mode is detailed
- Validation: semester_data rejected when mode is quick
- Validation: semester_data course structure enforced (grade required, min:1 courses)
- Validation: projected_grades can be empty array when mode is detailed
- Validation: projected_grades must have min:1 when mode is quick

### Unit Tests (Client)
- `calculateCumulativeCgpa` with 0, 1, and multiple semesters
- `calculateCumulativeCgpa` with mixed empty and filled semesters
- `calculateCumulativeCgpa` result capped at `scaleMax`
- `calculateCumulativeCgpa` `semestersWithData` counts only semesters with at least one graded course
- `prepareSemesterDataForSubmission` removes incomplete courses (missing code, credits, or grade) and empty semesters
- Import of `semester: "both"` courses into both First and Second panels doubles credits (expected behavior)

### Unit Tests (Backend)
- Service `calculateProjectedCgpa` with flattened grades from detailed simulation
- Validation passes for `mode: 'detailed'` with `current_cgpa: 0`
- Controller flattens `semester_data` into `projected_grades` for detailed mode

## Performance Note

Accordion panels use Radix's default `forceMount={false}` — collapsed panels are not rendered to the DOM. This keeps the page responsive even with 8–10 semesters containing many courses each.

Chart axis labels abbreviate long names: "Extra Year 1" → "EY1", "Extra Year 2" → "EY2". Regular levels use existing compact format ("100L First"). X-axis labels are angled at -45° when more than 6 bars are visible to prevent overlap.

## Out of Scope

- Export/PDF download of simulation results
- Side-by-side simulation comparison
- Integration with actual course grade history (auto-populating past grades)
- Drag-and-drop reordering of semesters
- Cross-semester duplicate course detection (students manage their own what-if entries)
- Changes to `calculate` or `reverseCalculate` JSON endpoints
- Per-mode simulation count limits (both modes share the 10-slot pool)
