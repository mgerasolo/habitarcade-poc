# Epic 2: Habit Matrix

## Epic Overview
Core habit tracking grid - the heart of HabitArcade. Visual accountability through color-coded daily tracking.

## Priority
**Critical** - Week 1 MVP - Primary feature

## Stories

### Story 2.1: Habit Data Model & API
**As a** developer
**I want** habits and habit_entries tables with CRUD API
**So that** habit data can be stored and retrieved

**Acceptance Criteria:**
- [ ] habits table: id, name, category, sort_order, created_at, deleted_at
- [ ] habit_entries table: id, habit_id, date, status, created_at, updated_at
- [ ] GET /api/habits - list all (exclude deleted)
- [ ] POST /api/habits - create habit
- [ ] PATCH /api/habits/:id - update habit
- [ ] DELETE /api/habits/:id - soft delete
- [ ] GET /api/habit-entries?month=YYYY-MM - entries for month
- [ ] PUT /api/habit-entries - upsert entry (habit_id + date)

**Technical Notes:**
- Status enum: empty, complete, missed, partial, na, exempt, extra, trending, pink
- Unique constraint on habit_entries (habit_id, date)

---

### Story 2.2: StatusCell Component
**As a** user
**I want** to click a cell to cycle its status
**So that** I can quickly mark habits

**Acceptance Criteria:**
- [ ] 24x24px cell (desktop), 16x16px (mobile)
- [ ] Shows status color (9 colors defined)
- [ ] Single click cycles: empty → complete → missed → empty
- [ ] Instant color change (<50ms)
- [ ] Subtle scale animation on click (1.05x)
- [ ] Cursor pointer on hover

**Technical Notes:**
- Optimistic update via TanStack Query mutation
- Use Tailwind status-* color classes

---

### Story 2.3: StatusTooltip Component
**As a** user
**I want** to access all 9 statuses via hover/long-press
**So that** I can set edge-case statuses

**Acceptance Criteria:**
- [ ] Appears on hover (desktop) after 200ms
- [ ] Appears on long-press (mobile) after 300ms
- [ ] 3x3 grid of status options
- [ ] Each shows color swatch + label
- [ ] Click selects status and closes tooltip
- [ ] Escape key closes tooltip

---

### Story 2.4: HabitRow Component
**As a** user
**I want** to see a habit's name and all its daily cells
**So that** I can track one habit across the month

**Acceptance Criteria:**
- [ ] Habit name in first column (condensed font, 12px)
- [ ] 31 StatusCell components for days
- [ ] Future dates show empty (not clickable)
- [ ] Today column highlighted with blue-100 background
- [ ] Row height 26px

---

### Story 2.5: CategoryRow Component
**As a** user
**I want** habits grouped by category
**So that** I can organize and collapse groups

**Acceptance Criteria:**
- [ ] Category header row with name
- [ ] Expand/collapse toggle (chevron icon)
- [ ] Collapsed state hides child habits
- [ ] State persists in local storage
- [ ] Visual distinction from habit rows (bold, slight indent)

---

### Story 2.6: HabitMatrix Widget
**As a** user
**I want** the complete habit grid in a widget
**So that** I can see all habits × days at once

**Acceptance Criteria:**
- [ ] Renders all categories and habits
- [ ] Column headers for dates (1-31)
- [ ] Sticky habit name column on horizontal scroll
- [ ] Today column visually prominent
- [ ] Fits in WidgetContainer
- [ ] Shows current month by default

---

### Story 2.7: Scoring Display
**As a** user
**I want** to see my completion score
**So that** I know my success rate

**Acceptance Criteria:**
- [ ] Score = completions / live days
- [ ] Live days excludes: N/A, Exempt, future dates
- [ ] Displayed as percentage (e.g., "78%")
- [ ] Per-habit score in row
- [ ] Overall score in widget header
- [ ] Updates on each status change

---

### Story 2.8: Markdown Habit Import
**As a** user
**I want** to import habits from a markdown file
**So that** I can bootstrap my habit list

**Acceptance Criteria:**
- [ ] Parse markdown format from sample-habits.md
- [ ] Import creates habits with categories
- [ ] POST /api/habits/import endpoint
- [ ] Skips duplicates (by name)
- [ ] Returns count of imported habits

---

### Story 2.9: Day Boundary Logic
**As a** user
**I want** unmarked habits to turn pink at 6 AM
**So that** I'm reminded to update yesterday

**Acceptance Criteria:**
- [ ] 6 AM boundary (user setting, default)
- [ ] After boundary, unmarked yesterday habits → pink status
- [ ] Settings API for day_boundary_hour
- [ ] Pink applied on page load if applicable
- [ ] Pink is clickable like any other status

**Technical Notes:**
- Check on client load, not server cron
- Store boundary hour in settings table

---

## Definition of Done
- All stories complete
- Click-to-cycle feels instant
- Month view renders 30+ habits smoothly
