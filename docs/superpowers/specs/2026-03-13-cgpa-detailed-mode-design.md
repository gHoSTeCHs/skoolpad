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
- Semester labels in `SemesterData` use display format: `"First Semester"`, `"Second Semester"`. The `Semester` enum values (`first`, `second`) from `enrolledCourses` are mapped for import matching: `"first"` → `"First Semester"`, `"second"` → `"Second Semester"`.

## User Flow

1. Student clicks "New Simulation"
2. Mode selector appears: Quick / Detailed
3. Student picks "Detailed"
4. System generates semester shells from `levelProgression` (e.g., 8 panels for a 4-year university: 100L First Semester, 100L Second Semester, ..., 400L Second Semester)
5. Student expands a semester, adds courses (manually or via "Import Enrolled" filtered by level/semester), selects grades
6. Cumulative CGPA, classification, and GPA trend chart update live as grades are entered across any semester
7. Student names and saves the simulation
8. Loading a saved detailed simulation restores all semester panels with their courses

### Mode Switching

If a student starts entering data in one mode and switches to the other via the mode selector, entered data is discarded with a confirmation dialog: "Switching modes will clear your current entries. Continue?" This avoids complex migration between incompatible data shapes.

## Page Layout

Two-column grid (unchanged):
- **Left column:** Mode-dependent calculator (quick or detailed)
- **Right column:** Saved simulations list + reverse calculator (shared across modes)

Header gains a mode badge in detailed mode: "Grade Calculator — Detailed".

Mode toggle only appears when creating a new simulation. Loading a saved simulation auto-selects its mode.

## Detailed Calculator — Accordion Structure

```
Simulation Name: [________________]

▼ 100L — First Semester          GPA: 3.80  |  15 credits  [●]
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
- **Import Enrolled** — filters `enrolledCourses` by matching `level` and `semester` metadata (using the mapping from Assumptions section), imports only courses for that specific semester. Enrolled courses with `null` level or semester are excluded from import.
- **Remove course** — same as quick mode (visible on mobile, hover-reveal on desktop)

### Add Semester

Button at the bottom of the accordion list. Opens a small dialog/popover:
- **Level** dropdown: options from `levelProgression` + "Extra Year"
- **Semester** dropdown: "First Semester", "Second Semester"
- Creates a new empty semester panel, inserted in level/semester order (not appended to the end)
- Already-existing level+semester combinations are disabled in the dropdowns to prevent duplicates

Each semester has a remove button in its header (with confirmation dialog if it contains courses).

## Results & Calculation

### Results Panel (Detailed Mode)

Adapts based on mode:
- Shows **Cumulative CGPA** (not "Projected CGPA")
- Classification badge and progress bar unchanged
- Stats row: Cumulative CGPA | Total Credits | Semesters with Data

### CGPA Calculation

Cumulative CGPA = `sum(quality_points across all semesters) / sum(credits across all semesters)`

Per-semester GPA computed via existing `calculateGpa()`. Cumulative aggregation is a new `calculateCumulativeCgpa()` function in `cgpa-calculator.ts`.

### Semester GPA Chart

Renders automatically when any semester has graded courses. Bar per semester showing GPA. Existing component — two fixes needed:

1. **`hsl()` bug:** CSS custom properties (`--badge-primary-fg`, `--border`, `--card`) return raw hex values (e.g., `#0C7B56`), not HSL channel values. Remove ALL `hsl()` wrappers in the component — `colors.primary`, `colors.grid`, `colors.card`, and `colors.border` are all used with `hsl()` wrappers in 4 places (tooltip style + CartesianGrid stroke + Bar fill). Use values directly.
2. **Theme reactivity:** `useChartColors` reads CSS vars once on mount (empty deps array). Add a `MutationObserver` on `document.documentElement` class changes to re-read vars when the theme switches.

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
  "projected_grades": [
    { "course_code": "GST 101", "course_title": "Use of English", "credit_units": 2, "grade": "A" },
    { "course_code": "CSC 101", "course_title": "Intro to CS", "credit_units": 3, "grade": "B" }
  ],
  "semester_data": [
    {
      "level": "100L",
      "semester": "First Semester",
      "courses": [
        { "course_code": "GST 101", "course_title": "Use of English", "credit_units": 2, "grade": "A" },
        { "course_code": "CSC 101", "course_title": "Intro to CS", "credit_units": 3, "grade": "B" }
      ]
    }
  ],
  "target_cgpa": null
}
```

### Save Payload Rules

- **`projected_grades`** is a flattened copy of every graded course across all semesters — the frontend MUST populate this with the exact same set of courses that `calculateCumulativeCgpa` uses. This maintains backward compatibility with the server-side CGPA calculation.
- **`semester_data`** only includes semesters that have at least one course with a grade. Empty semester shells are filtered out client-side before submission (avoids `min:1` validation failures on empty course arrays).
- **`current_cgpa`** and **`current_credit_hours`** are zeroed (not used in detailed mode, but columns are non-nullable). No FormRequest changes needed — `min:0` already exists in the rules. The server-side `calculateProjectedCgpa` computes `oldQualityPoints = currentCgpa * currentCredits` which equals `0 * 0 = 0`, so the result is purely from `projected_grades` — matching the frontend's cumulative calculation.
- **Save button is disabled** until at least one semester has at least one fully-graded course (course_code + credit_units + grade all filled).

### Load Behavior

`mode` field determines which calculator renders. Quick simulations load the flat calculator. Detailed simulations populate the accordion from `semester_data`.

### Simulation List

Each saved simulation card shows a small badge: "Quick" or "Detailed".

### Validation

Existing `semester_data.*` nested rules (from medium audit fixes) already validate the structure. No FormRequest changes needed for detailed mode — `current_cgpa` and `current_credit_hours` already allow `min:0`, and empty semesters are filtered client-side before submission.

## Components & File Structure

### New Components

| Component | Purpose |
|-----------|---------|
| `partials/mode-selector.tsx` | Quick/Detailed toggle for new simulations |
| `partials/quick-calculator.tsx` | Extracted from current `index.tsx` — existing quick mode logic. Note: current `handleSave` hardcodes `mode: 'quick'`; this stays correct after extraction. |
| `partials/detailed-calculator.tsx` | Accordion container, semester state management, cumulative computation, save handler |
| `partials/semester-panel.tsx` | Single accordion item: header + course grid body |
| `partials/add-semester-dialog.tsx` | Level/semester picker for adding custom semesters |

### Modified Components

| Component | Changes |
|-----------|---------|
| `index.tsx` | Add mode state, conditionally render quick or detailed calculator |
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

Iterates all semesters, sums quality points and credits, returns cumulative CGPA capped at `scaleMax`. When all semesters are empty (zero total credits), returns `cumulativeCgpa: 0`, `totalCredits: 0`, `totalQualityPoints: 0`, `semestersWithData: 0`.

### Backend

- No new migrations, models, or endpoints
- No service changes
- No FormRequest changes needed (`min:0` already in rules, empty semesters filtered client-side)

## Testing

### Feature Tests
- Save a detailed simulation with multi-semester data
- Load a detailed simulation and verify semester_data in response
- Mode badge present in simulation list response
- Validation: semester_data structure enforced in detailed mode

### Unit Tests (Client)
- `calculateCumulativeCgpa` with 0, 1, and multiple semesters
- `calculateCumulativeCgpa` with mixed empty and filled semesters
- `calculateCumulativeCgpa` result capped at `scaleMax`

### Unit Tests (Backend)
- Service `calculateProjectedCgpa` with flattened grades from detailed simulation
- Validation passes for `mode: 'detailed'` with `current_cgpa: 0`

## Out of Scope

- Export/PDF download of simulation results
- Side-by-side simulation comparison
- Integration with actual course grade history (auto-populating past grades)
- Drag-and-drop reordering of semesters
