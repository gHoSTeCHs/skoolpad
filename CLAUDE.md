# Skoolpad

Nigerian educational platform for tertiary (university/polytechnic/college) and secondary school students. Provides question practice with 16 question types, spaced repetition (SM-2), content management, exam preparation, CGPA simulation, guided study plans, and gamification (XP, badges, streaks, leaderboards). Monetization via Paystack subscription tiers gating answer depth levels and daily AI/OCR limits.

## Dev Commands

```bash
composer run dev               # Full dev (both servers)
php artisan test --compact     # Run Pest tests (compact output)
php artisan test --compact --filter=testName  # Run specific test
vendor/bin/pint --dirty --format agent        # Fix code style (dirty files only)
npm run build                  # Production frontend build
```

## Institution Scoping (IMPORTANT)

There is NO formal multi-tenancy package, NO global scopes, NO tenant middleware. Institution scoping is manual and relationship-based:

- `StudentProfile` has `institution_id` FK → Institution
- `InstitutionCourse` has `institution_id` FK → Institution
- `Faculty` has `institution_id` FK → Institution
- Controllers manually filter with `->where('institution_id', ...)` or `->whereHas(...)`
- Student enrollment chains through: StudentProfile → StudentCourse → InstitutionCourse → Institution

Content has a dual scope model:

- **Platform-wide**: CanonicalTopic, ContentBlock, Discipline (not institution-scoped)
- **Institution-scoped**: InstitutionCourse, Faculty, Department, CourseTopicMapping

Students can browse cross-institution content via `browse_all` flag, but their enrolled courses are institution-scoped.

### InstitutionModerator Scoping (TBD)

The `manage_scoped_*` permissions exist in the UserRole enum but the actual mechanism for assigning moderators to institutions is not yet built. No `moderator_institution_id` or pivot table exists yet.

## Authentication & Authorization

### Auth Stack

Fortify (session-based, no Sanctum/API tokens). New users always register as `Student` role.

### Role System (Enum-Driven, NOT Spatie)

All authorization flows through `UserRole` enum methods. No Spatie packages. Only one Policy exists (QuestionPolicy).

| Role                 | Level | Staff? | Key Permissions                                          |
| -------------------- | ----- | ------ | -------------------------------------------------------- |
| SuperAdmin           | 999   | Yes    | Everything (22 permissions)                              |
| ContentManager       | 100   | Yes    | Topics, courses, questions, publishing, bulk import      |
| InstitutionModerator | 70    | Yes    | Scoped courses/questions/submissions (scoping TBD)       |
| ContentReviewer      | 60    | Yes    | Review submissions, view content analytics               |
| CommunityModerator   | 50    | Yes    | Reported content, user flags                             |
| Student              | 10    | No     | View/practice content, submit contributions, own profile |

Secondary roles: Users can hold a `secondary_role` (e.g., Student + ContentReviewer), but authorization currently only checks the primary `role` field.

### Middleware

| Alias        | Class                    | Purpose                                                 |
| ------------ | ------------------------ | ------------------------------------------------------- |
| `onboarded`  | EnsureOnboardingComplete | Redirects students without StudentProfile to onboarding |
| `staff`      | EnsureUserIsStaff        | 403 if not staff role                                   |
| `permission` | EnsureUserHasPermission  | 403 if role lacks specified permission                  |

### Route Protection

| Routes             | Middleware                |
| ------------------ | ------------------------- |
| Student features   | auth, verified, onboarded |
| Admin (`/admin/*`) | auth, verified, staff     |
| Settings           | auth, verified            |
| Onboarding         | auth, verified            |

## Student System

### Two Student Types

StudentProfile branches into two completely different flows:

**Tertiary**: institution_id, faculty_id, department_id, level (100L–700L), matric_number, admission_year
**Secondary**: institution_type_id, education_system_id, education_level_id, stream_id, school_name, state_or_region

Check with `$profile->isTertiary()` / `$profile->isSecondary()`. Dashboard, course enrollment, and study plan logic all branch on student type.

### Onboarding

13-step onboarding flow (CompleteOnboardingRequest) with tertiary vs secondary branching. Creates StudentProfile, enrolls in suggested courses, sets exam goals and study preferences. Student cannot access main app until onboarded (enforced by `onboarded` middleware).

### Practice Engine

PracticeService is the core learning engine:

1. `createSession()` — Config: course, topics, difficulty, type, mode, count, time limit
2. `selectQuestions()` — Smart filtering, excludes recently-correct for spaced repetition
3. `submitAnswer()` — Auto-grades 12 of 16 question types
4. `completeSession()` — Final score, triggers spaced repetition scheduling

**8 Practice Modes**: Timed, Untimed, Review, SpeedDrill, WeakTopic, YearWalk, RandomMix, FullMock

**Auto-Gradable** (12): MCQ, MultiSelectMcq, TrueFalse, FillBlank, Cloze, Matching, Ordering, DiagramLabel, Calculation, NumericEntry, AssertionReason, MatrixMatching
**Manual-Grade** (4): Theory, ShortAnswer, Essay, Group

### Spaced Repetition (SM-2)

SpacedRepetitionService: ease_factor (default 2.50), interval_days, repetition_count. Items cycle through Active → Graduated → Suspended.

### Guided Study

GuidedStudyService builds daily plans with 4 priority tiers:

1. Spaced repetition reviews (highest)
2. Scheme of work items for current term/week
3. Weak topics (remediation)
4. Next unread content blocks

## Content System

### Content Hierarchy

```
Discipline (Computer Science, Engineering, etc.)
└── CanonicalTopic (platform-wide, not institution-scoped)
    └── ContentBlock (hierarchical, max depth 5, types: container/text/code/diagram/example/exercise/quiz/reference/comparison)
        └── Prerequisites (block-to-block, hard vs soft)
```

### Question System

Questions can belong to InstitutionCourse OR ExamSubject (XOR constraint — never both). 16 question types defined in QuestionType enum. Questions have status lifecycle: Draft → InReview → Published → Archived.

**QuestionAnswer** provides answers at multiple depth levels (quick, standard, deep_dive). One answer per depth per question. Depth access is gated by subscription tier when monetization is enabled.

### Content Submission Pipeline

Students can submit: Questions, Corrections, TopicContent, PastQuestionUploads. Flow: Pending → Approved/Rejected via ContentReviewService. Approved question submissions become actual Question records.

## Academic Structure

```
Country
├── Institution
│   ├── Faculty → Department
│   ├── InstitutionCourse → CourseDepartmentOffering
│   │   ├── CourseTopicMapping (syllabus: topic sequence + weight)
│   │   ├── CourseBlockMapping (teaching depth per block)
│   │   └── SchemeOfWorkItem (term/week schedule)
│   └── CalendarTerm (academic year terms)
├── EducationSystem (NERDC, WAEC, etc.)
│   ├── CurriculumTier → EducationLevel
│   ├── Stream (Science, Commerce, Arts)
│   ├── CurriculumSubject → LevelSubject
│   └── AssessmentType → AssessmentSubject
├── ExamType (JAMB, WAEC, NECO — legacy) → ExamSubject
├── InstitutionType (level_progression, credit_system, grading_scale)
└── GradingScale (CGPA, GPA, percentage, letter, points, classification)
```

## Gamification

- **UserLevel**: current_xp, current_level, streak_days, longest_streak, streak_freeze
- **XpTransaction**: action-based XP awards with polymorphic reference
- **ContributionStat**: tracks student content submissions → ContributionBadge tiers
- **Leaderboard**: weekly_xp, rank, scoped by class_level
- **Badge/UserBadge**: Achievement system with requirement_type/value thresholds
- **CgpaSimulation**: what-if CGPA calculator

## Subscription & Monetization

Controlled by `config('skoolpad.monetization_enabled')` (env: `SKOOLPAD_MONETIZATION_ENABLED`).

When disabled: all users get Quick answer depth only.
When enabled: AnswerDepthService checks active subscription plan features JSON:

```json
{
    "daily_ocr": 5,
    "daily_ai_messages": 10,
    "daily_gradings": 20,
    "answer_depths": ["quick", "standard"]
}
```

Paystack integration is model-ready (plan codes, subscription codes, customer codes on models) but webhook controllers/services are not yet implemented.

Parent-paid subscriptions supported via `UserSubscription.paid_by` FK.

## Design System

Three appearance modes (not just light/dark):

| Mode                      | Heading Font        | Body Font      | Background           | Primary              |
| ------------------------- | ------------------- | -------------- | -------------------- | -------------------- |
| Light (Warm Editorial)    | Bricolage Grotesque | DM Sans        | Warm beige           | #1A6B4F (deep green) |
| Dark (Warm Editorial)     | Bricolage Grotesque | DM Sans        | #161210 (dark brown) | #1A6B4F              |
| Reader (Midnight Scholar) | Outfit              | Source Serif 4 | #0A1929 (deep blue)  | #3EBD93 (teal)       |

Custom Tailwind variant for Reader mode: `@custom-variant reader (&:is(.reader *));`

Palette names: Canopy (green), Ember (orange/rust), Honey (yellow/amber). 60+ semantic CSS tokens per mode.

## Frontend Specifics

### Key Libraries (beyond standard stack)

- **Tiptap** — Rich text editor (math/KaTeX, code highlighting, tables, images)
- **Recharts** — Data visualization
- **dnd-kit** — Drag and drop (reordering blocks, sections)
- **i18next** — Internationalization
- **shadcn/ui** — Component primitives (Radix UI)

### Shared Hooks

| Hook                  | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `useAppearance()`     | Theme management (light/dark/reader/system) |
| `useFilterHandlers()` | URL-based filtering for index pages         |
| `useSlug()`           | Slug generation from titles                 |
| `useMobile()`         | Responsive breakpoint detection             |
| `useInitials()`       | Name initials extraction                    |

### SSOT Form Components

All forms use `FormField`, `FormWrapper`, `FormPageLayout` components. Don't create new form wrappers.

### Type Files (26 files, 380+ types)

Key files: `models.ts` (core), `enums.ts`, `questions.ts` (16 type configs), `practice.ts`, `courses.ts`, `student-courses.ts`, `topics.ts`, `student-topics.ts`, `onboarding.ts` (13 steps), `auth.ts`, `dashboard.ts`, `guided-study.ts`

### State Management

No Redux/Zustand. Inertia shared data + URL state (useFilterHandlers) + useForm + localStorage for appearance only.

## Not Yet Implemented

- Paystack webhook controllers/payment processing
- InstitutionModerator → Institution assignment mechanism
- Events, Notifications, Observers (none exist)
- AI/ML integration (no API keys configured)
- Voting/Election module (Phase 3.5 — no code exists)

## Extra Quality Checks (Skoolpad-Specific)

Beyond global quality gates, verify on every PR:

- [ ] Institution-scoped queries explicitly filter by institution_id
- [ ] Student type branching (tertiary vs secondary) handled in both backend and frontend
- [ ] Question type handling covers all 16 types or explicitly throws for unsupported
- [ ] Content status lifecycle respected (Draft → InReview → Published → Archived)
- [ ] Answer depth access checks go through AnswerDepthService
- [ ] All three appearance modes tested (Light, Dark, Reader)
- [ ] Onboarding flow changes tested for both student types
- [ ] Practice engine changes have Pest tests with known input→output
- [ ] Spaced repetition scheduling verified after practice completion
