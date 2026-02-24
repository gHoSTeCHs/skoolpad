# Architecture Showcase Page — Design Document

**Date:** 2026-02-24
**Status:** Approved
**Route:** `GET /architecture-showcase` (public, no auth)
**File:** `resources/js/pages/architecture-showcase.tsx`

## Purpose

Interactive visual showcase demonstrating three proposed architectural changes to the Skoolpad platform. Serves dual purpose: internal evaluation tool and presentable artifact for stakeholders.

## Page Structure

1. **Hero** — Title, subtitle, theme switcher (matches design-showcase.tsx pattern)
2. **Overview** — 3 summary cards anchor-linking to detail sections
3. **Section 1: Block-Based Topics** — Before/after monolithic vs block tree + interactive tree explorer + "Why This Matters" callout cards
4. **Section 2: Curriculum Mapping** — Course coverage comparison (3 courses same topic) + borrowed course flow + elective groups + prerequisite chain
5. **Section 3: Question Hierarchy** — Before/after flat vs nested paper structure (CSC 212 2023)
6. **Section 4: Connecting the Dots** — Question → Block → Course mapping showing the full value proposition
7. **Footer**

## Data Sources

All data hardcoded as constants — no backend API.

- Section 1: CIT 204 (Data Structures) hierarchy from Block-Based Topic Structure spec (~79 blocks, 5 levels)
- Section 2a: CSC 111/CSC 224/CSC 311 coverage of Data Structures topic
- Section 2b: UNIOSUN 100L first semester (24 units, 1 major + 13 ancillary + 10 GST)
- Section 2c: UNIOSUN 400L first semester elective group (choose 1 from 6)
- Section 2d: CSC prerequisite chain (CSC 211 → 224 → 325 → 434) + cross-dept (MTH 101 → 227)
- Section 3: CSC 212 2023 Second Semester exam paper structure
- Section 4: Question 1(a) "Define ADT" → Block "Abstract Data Types" → CSC 224

## Technical Approach

- Single React page component
- Tree state via React useState (expand/collapse, selected block)
- Uses existing design tokens, SpBadge, CSS custom properties
- No new npm dependencies
- Follows design-showcase.tsx patterns: SectionLabel, SectionTitle, theme switcher

## Implementation Tasks

1. Add route in routes/web.php
2. Build page component with all sections
3. Hardcode data constants from analysis documents
4. Test across all three themes
