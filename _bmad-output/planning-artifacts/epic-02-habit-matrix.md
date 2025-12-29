---
epic: 2
title: Habit Matrix
priority: critical
phase: "Week 1 MVP"
dependencies: ["Epic 1 - Infrastructure & Dashboard"]
storyCount: 9
status: ready-for-implementation
createdAt: "2025-12-29"
---

# Epic 2: Habit Matrix

## Epic Goal

Implement the core Habit Matrix widget - the primary visual accountability system for habit tracking. This is the "heart" of HabitArcade, where users spend 70%+ of their time. The matrix displays habits as rows and dates as columns, with click-to-cycle status interaction and 9 distinct status states.

**Success Criteria:**
- User can view all habits in a monthly grid (31 days on desktop)
- Clicking a cell cycles through Empty → Complete → Missed → Empty
- Hover/long-press reveals tooltip for all 9 status options
- Scoring displays completions / live days (excluding N/A, Exempt, future)
- Day boundary (6 AM) turns unmarked habits pink
- Categories are collapsible row groupings
- Habits can be imported from markdown format

## Requirements Coverage

### Functional Requirements Addressed

| FR | Requirement | Stories |
|----|-------------|---------|
| FR6 | View habits in monthly grid (habits as rows, days as columns) | 2.5 |
| FR7 | Cycle habit status by clicking/tapping a day cell | 2.2 |
| FR8 | Mark habits with 9 status states | 2.2, 2.6 |
| FR9 | Display pink status for habits unmarked past day boundary | 2.9 |
| FR10 | Configure day boundary time (default 6 AM) | 2.9 |
| FR11 | Calculate habit scores using live-days formula | 2.7 |
| FR12 | View rollup metrics (percentage completion per habit) | 2.7 |
| FR13 | Organize habits into categories and subcategories | 2.4 |
| FR14 | Import habits from markdown format | 2.8 |
| FR15 | Add, edit, and soft-delete habits | 2.1 |
| FR16 | Hide/grey days not in current month | 2.5 |

### Non-Functional Requirements Addressed

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR1 | Page load < 3 seconds | TanStack Query caching, optimized queries |
| NFR2 | Interactions respond < 100ms | Optimistic updates, < 50ms target |
| NFR5 | No data loss | PostgreSQL persistence |
| NFR8 | Soft-deleted items recoverable | is_deleted flag pattern |
| NFR9 | Habit history immutable | Separate habit_entries table |

## Technical Context

### Database Schema (from Architecture)

**habits table:**
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**habit_entries table:**
```sql
CREATE TABLE habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id),
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'empty',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, date)
);
```

### Status State Machine

```typescript
type HabitStatus =
  | 'empty'      // Default - unmarked
  | 'complete'   // Green - done
  | 'missed'     // Red - not done
  | 'partial'    // Blue - partially done
  | 'na'         // Gray - not applicable
  | 'exempt'     // Yellow - excused
  | 'extra'      // Dark green - bonus
  | 'trending'   // Orange - at risk
  | 'pink';      // Pink - unmarked past boundary
```

### Component Structure (from Architecture)

```
client/src/widgets/HabitMatrix/
├── index.tsx           # Main widget export
├── HabitRow.tsx        # Individual habit row
├── CategoryRow.tsx     # Collapsible category header
├── StatusCell.tsx      # Clickable status cell
├── ScoreColumn.tsx     # Scoring display
├── StatusTooltip.tsx   # 9-option hover menu
└── useHabitMatrix.ts   # TanStack Query hooks
```

### API Endpoints (from Architecture)

```
GET    /api/habits                    # List all habits
POST   /api/habits                    # Create habit
GET    /api/habits/:id                # Get single habit
PUT    /api/habits/:id                # Update habit
DELETE /api/habits/:id                # Soft delete habit
POST   /api/habits/:id/entries        # Create/update entry
GET    /api/habits/entries?month=YYYY-MM  # Get entries for month
POST   /api/habits/import             # Import from markdown
```

---

## Story 2.1: Habit Data Model and API Endpoints

As a developer,
I want a complete habit data model with CRUD API endpoints,
So that the frontend can persist and retrieve habit data reliably.

**Acceptance Criteria:**

**Given** the database is empty
**When** I POST to `/api/habits` with `{ "name": "Exercise", "category": "Health" }`
**Then** a new habit is created with UUID, timestamps, and default display_order
**And** the response includes the full habit object with status 201

**Given** habits exist in the database
**When** I GET `/api/habits`
**Then** I receive all non-deleted habits sorted by category then display_order
**And** the response format is `{ data: Habit[], count: number }`

**Given** a habit with id `abc123` exists
**When** I PUT `/api/habits/abc123` with `{ "name": "Morning Exercise" }`
**Then** the habit name is updated and updated_at timestamp changes
**And** the response includes the updated habit object

**Given** a habit with id `abc123` exists
**When** I DELETE `/api/habits/abc123`
**Then** the habit's `is_deleted` is set to true and `deleted_at` is timestamped
**And** the habit no longer appears in GET `/api/habits` (soft delete)
**And** the response is 204 No Content

**Given** I want to see deleted habits
**When** I GET `/api/habits?includeDeleted=true`
**Then** I receive both active and soft-deleted habits

### Technical Notes

- Use Drizzle ORM for type-safe queries
- Zod schemas for request validation
- Return consistent error format: `{ error: string, code?: string }`
- Handle duplicate category collation (case-insensitive grouping)

### Definition of Done

- [ ] Drizzle schema for `habits` table
- [ ] CRUD routes in `server/src/routes/habits.ts`
- [ ] Zod validation in `server/src/validators/habit.ts`
- [ ] Business logic in `server/src/services/habitService.ts`
- [ ] API integration tests covering all endpoints
- [ ] Error handling for not found, validation errors

---

## Story 2.2: StatusCell Component (Click Cycling, Color States)

As a user,
I want to click a habit cell to cycle through common statuses,
So that I can quickly mark my daily habits without extra steps.

**Acceptance Criteria:**

**Given** a StatusCell displays "empty" status
**When** I click the cell
**Then** it immediately changes to "complete" (green)
**And** the color change happens in < 50ms (optimistic update)

**Given** a StatusCell displays "complete" status
**When** I click the cell
**Then** it immediately changes to "missed" (red)

**Given** a StatusCell displays "missed" status
**When** I click the cell
**Then** it immediately changes to "empty" (gray/white)

**Given** any StatusCell
**When** I click it
**Then** a subtle scale animation (1.05x → 1.0x over 100ms) provides feedback
**And** an API mutation fires in the background

**Given** the API mutation fails
**When** the error is detected
**Then** the cell reverts to its previous status
**And** a toast notification shows the error

### Visual Specifications

| Status | Background Color | Tailwind Class |
|--------|-----------------|----------------|
| empty | #f3f4f6 | bg-gray-100 |
| complete | #22c55e | bg-green-500 |
| missed | #ef4444 | bg-red-500 |
| partial | #3b82f6 | bg-blue-500 |
| na | #9ca3af | bg-gray-400 |
| exempt | #eab308 | bg-yellow-500 |
| extra | #15803d | bg-green-700 |
| trending | #f97316 | bg-orange-500 |
| pink | #f9a8d4 | bg-pink-300 |

### Technical Notes

```typescript
interface StatusCellProps {
  status: HabitStatus;
  habitId: string;
  date: string; // ISO date string YYYY-MM-DD
  isToday: boolean;
  size: 'sm' | 'md'; // sm=16px, md=24px
  onStatusChange: (newStatus: HabitStatus) => void;
}
```

- Click cycle order: empty → complete → missed → empty
- Use TanStack Query mutation with optimistic updates
- Cell size: 24px desktop, 16px mobile
- Border radius: 2px (per UX spec)

### Definition of Done

- [ ] StatusCell component with all 9 color states
- [ ] Click handler cycling through common statuses
- [ ] Scale animation on click (100ms, 1.05x)
- [ ] Optimistic update pattern with rollback
- [ ] Accessible: keyboard focusable, Enter/Space triggers click
- [ ] ARIA label: "{habit name}, {date}, {status}"

---

## Story 2.3: HabitRow Component with Habit Name

As a user,
I want to see my habit name alongside its daily cells,
So that I can easily identify which habit I'm tracking.

**Acceptance Criteria:**

**Given** a habit "Morning Exercise" with category "Health"
**When** the HabitRow renders
**Then** the habit name appears in the leftmost column
**And** status cells appear for each day in the current view

**Given** the habit name is longer than available space
**When** the HabitRow renders
**Then** the name is truncated with ellipsis
**And** hovering shows the full name in a tooltip

**Given** responsive breakpoints
**When** on desktop (xl)
**Then** 31 day cells are shown (full month)
**When** on tablet (md)
**Then** 7 day cells are shown (week view)
**When** on mobile (sm)
**Then** 3 day cells are shown (today, yesterday, day before)

**Given** a habit row
**When** I hover over the row
**Then** a subtle background highlight appears
**And** the highlight does not interfere with cell colors

### Technical Notes

```typescript
interface HabitRowProps {
  habit: Habit;
  entries: Map<string, HabitStatus>; // date -> status
  dates: string[]; // Array of ISO date strings to display
  onStatusChange: (habitId: string, date: string, status: HabitStatus) => void;
}
```

- Name column: fixed width (150px desktop, 100px mobile)
- Font: 12px condensed (per UX spec)
- Row height: 26px desktop, 18px mobile
- Use CSS Grid for alignment

### Definition of Done

- [ ] HabitRow component rendering name + cells
- [ ] Name truncation with hover tooltip
- [ ] Responsive cell count (31/7/3 based on breakpoint)
- [ ] Row hover highlight
- [ ] Proper grid alignment with CategoryRow

---

## Story 2.4: CategoryRow Component (Collapsible)

As a user,
I want to organize my habits into collapsible categories,
So that I can group related habits and reduce visual clutter.

**Acceptance Criteria:**

**Given** habits are grouped by category
**When** the HabitMatrix renders
**Then** each category appears as a distinct row header
**And** habits under that category appear below

**Given** a CategoryRow with category "Health" containing 5 habits
**When** I click the category row
**Then** the 5 habit rows collapse/hide
**And** the category row shows a collapsed indicator (chevron)

**Given** a collapsed category
**When** I click the category row again
**Then** the habit rows expand/show
**And** the chevron rotates to expanded state

**Given** a category is collapsed
**When** I refresh the page
**Then** the category remains collapsed (state persisted)

**Given** uncategorized habits exist
**When** the matrix renders
**Then** uncategorized habits appear at the bottom under "Uncategorized"

### Visual Specifications

- Category row background: slightly darker (gray-50)
- Category font: 14px semibold
- Chevron icon: 16px, rotates 90° on expand/collapse
- Category row spans full width (name column + all date columns)
- Indent habit names under category by 8px

### Technical Notes

```typescript
interface CategoryRowProps {
  category: string;
  habitCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}
```

- Store collapsed state in Zustand (useDashboardStore or new useMatrixStore)
- Persist to localStorage for cross-session retention
- Animation: 150ms ease-out for expand/collapse

### Definition of Done

- [ ] CategoryRow component with expand/collapse
- [ ] Chevron rotation animation
- [ ] Collapse state persisted to localStorage
- [ ] Uncategorized habits handled
- [ ] Keyboard accessible (Enter/Space to toggle)
- [ ] ARIA: role="button", aria-expanded

---

## Story 2.5: HabitMatrix Widget (Full Grid)

As a user,
I want to see all my habits in a monthly grid widget,
So that I can scan my habit patterns at a glance.

**Acceptance Criteria:**

**Given** I have 20 habits across 4 categories
**When** the HabitMatrix widget renders
**Then** I see a header row with date numbers (1-31)
**And** category rows with their habits underneath
**And** a scrollable area if content exceeds widget height

**Given** the current date is January 15th
**When** the matrix renders
**Then** day columns 1-31 are shown for January
**And** the "15" column (today) has a highlighted background
**And** days 16-31 show as future (lighter styling)

**Given** it's February (28 days)
**When** the matrix renders
**Then** columns 29-31 are hidden or greyed out
**And** scoring calculations exclude these days

**Given** the matrix widget in the dashboard
**When** I resize the widget
**Then** the date columns adapt (more/fewer visible)
**And** horizontal scroll appears if needed

**Given** responsive breakpoints
**When** on mobile (< 640px)
**Then** only 3 days show (today, yesterday, day before)
**And** the widget adapts to vertical stacking if needed

### Visual Specifications

- Header row: date numbers (1-31) in same cell size as status cells
- Today column: blue-100 (#dbeafe) background highlight
- Future days: reduced opacity (0.5)
- Days not in month: hidden (preferred) or gray strikethrough
- Widget padding: 16px internal
- Grid gap: 1px between cells

### Technical Notes

```typescript
interface HabitMatrixProps {
  month?: string; // YYYY-MM format, defaults to current
}

// Internal hook
function useHabitMatrix(month: string) {
  // Returns habits, entries, loading state
  // Handles date range calculation
  // Manages collapsed categories
}
```

- Use react-grid-layout for widget container
- TanStack Query for data fetching with 30s polling
- Memoize date calculations
- Virtual scrolling not needed (50 habits max for POC)

### Definition of Done

- [ ] HabitMatrix widget with header row
- [ ] Category and habit rows rendering
- [ ] Today column highlighting
- [ ] Future days styling
- [ ] Days-not-in-month handling
- [ ] Responsive date column count
- [ ] Horizontal scroll for overflow
- [ ] Integration with dashboard layout

---

## Story 2.6: Status Tooltip (All 9 Options)

As a user,
I want to access all 9 status options via hover or long-press,
So that I can mark edge-case statuses like Partial, N/A, or Exempt.

**Acceptance Criteria:**

**Given** I am on desktop
**When** I hover over a StatusCell for 300ms
**Then** a tooltip appears showing all 9 status options
**And** each option shows its color and label

**Given** I am on mobile
**When** I long-press a StatusCell for 500ms
**Then** the same tooltip appears
**And** the tooltip is positioned to not go off-screen

**Given** the tooltip is open
**When** I click/tap a status option
**Then** the cell immediately updates to that status
**And** the tooltip closes

**Given** the tooltip is open
**When** I move my mouse away (desktop) or tap outside (mobile)
**Then** the tooltip closes without changing status

**Given** the tooltip is open
**When** I press Escape
**Then** the tooltip closes without changing status

### Tooltip Layout

```
┌────────────────────────┐
│ ⬜ Empty               │
│ ✅ Complete            │
│ ❌ Missed              │
│ 🔵 Partial             │
│ ⬛ N/A                 │
│ 🟡 Exempt              │
│ 🟢 Extra               │
│ 🟠 Trending-Fail       │
│ 🩷 Pink/Unmarked       │
└────────────────────────┘
```

- Each row: color swatch (16px) + label
- Hover state on each option
- Current status visually indicated (checkmark or border)

### Technical Notes

```typescript
interface StatusTooltipProps {
  currentStatus: HabitStatus;
  onSelect: (status: HabitStatus) => void;
  onClose: () => void;
  position: { x: number; y: number };
}
```

- Use Headless UI or custom portal for tooltip
- Position intelligently (avoid screen edges)
- Desktop: hover delay 300ms, mouse leave closes
- Mobile: long-press 500ms, tap outside closes
- Prevent body scroll on mobile when open

### Definition of Done

- [ ] StatusTooltip component with all 9 options
- [ ] Desktop hover trigger (300ms delay)
- [ ] Mobile long-press trigger (500ms)
- [ ] Smart positioning (viewport awareness)
- [ ] Keyboard: Escape to close
- [ ] Current status indicator
- [ ] Touch-friendly option sizing (44px min height)

---

## Story 2.7: Scoring Calculation Display

As a user,
I want to see my habit completion score,
So that I can understand my consistency as a percentage.

**Acceptance Criteria:**

**Given** a habit with 10 days in the current month
**When** 7 are Complete, 1 is Missed, 1 is N/A, 1 is future
**Then** the score displays as 87.5% (7 / 8 live days)
**And** the denominator excludes N/A (1) and future (1)

**Given** a habit with all Complete statuses
**When** the score calculates
**Then** it displays as 100%
**And** a green color indicates success

**Given** a habit with 0 Complete out of 10 live days
**When** the score calculates
**Then** it displays as 0%
**And** a red color indicates attention needed

**Given** a habit that's all N/A or Exempt
**When** the score calculates
**Then** it displays as "—" (dash) instead of percentage
**And** tooltip explains "No trackable days"

**Given** the scoring algorithm
**When** calculating "live days"
**Then** it excludes: N/A, Exempt, future dates, days not in month
**And** Partial counts as 0.5 completion
**And** Extra counts as 1.0 completion

### Score Color Thresholds

| Range | Color | Meaning |
|-------|-------|---------|
| 90-100% | Green | Excellent |
| 70-89% | Yellow | Good |
| 50-69% | Orange | Needs work |
| 0-49% | Red | Attention |

### Technical Notes

```typescript
interface ScoreColumnProps {
  habitId: string;
  entries: HabitEntry[];
  dates: string[]; // visible date range
}

function calculateScore(entries: HabitEntry[], dates: string[]): {
  score: number | null; // null = no trackable days
  completed: number;
  liveDays: number;
}
```

- Score displayed in rightmost column of HabitRow
- Font: 12px, right-aligned
- Width: 50px fixed
- Update reactively as statuses change

### Definition of Done

- [ ] ScoreColumn component
- [ ] Live days calculation (excludes N/A, Exempt, future)
- [ ] Partial = 0.5 weighting
- [ ] Color coding by threshold
- [ ] "—" display for no trackable days
- [ ] Tooltip with breakdown (7/8 days)
- [ ] Real-time update on status change

---

## Story 2.8: Markdown Habit Import

As a user,
I want to import my habits from a markdown file,
So that I can quickly set up my habit list without manual entry.

**Acceptance Criteria:**

**Given** a markdown file with habit definitions
**When** I use the import feature
**Then** habits are created in the database with correct categories

**Given** the markdown format:
```markdown
## Health
- Exercise
- Drink water
- Take vitamins

## Productivity
- Morning routine
- Review goals
```
**When** imported
**Then** 5 habits are created with categories "Health" and "Productivity"

**Given** duplicate habit names in the import
**When** processing
**Then** duplicates are skipped with a warning
**And** unique habits are still imported

**Given** habits already exist in the database
**When** importing
**Then** existing habits are NOT overwritten
**And** only new habits are added
**And** a summary shows "3 added, 2 skipped (existing)"

**Given** an improperly formatted markdown
**When** importing
**Then** an error message explains the format issue
**And** no habits are created (atomic operation)

### Import UI Flow

1. User clicks "Import Habits" button in widget header
2. Modal opens with:
   - File upload input (.md files)
   - OR textarea for paste
   - Format instructions/example
3. User selects file or pastes content
4. Preview shows parsed habits by category
5. User confirms import
6. Success/error summary displayed

### Technical Notes

**API Endpoint:**
```
POST /api/habits/import
Content-Type: application/json
{
  "markdown": "## Health\n- Exercise\n- Drink water"
}

Response:
{
  "data": {
    "imported": 3,
    "skipped": 2,
    "errors": []
  }
}
```

- Parse markdown on server (not client)
- Use regex or markdown parser for structure
- Validate category/habit name lengths
- Transaction: all or nothing on error

### Definition of Done

- [ ] Import modal component
- [ ] File upload and paste support
- [ ] Markdown parsing logic
- [ ] Preview before import
- [ ] API endpoint with validation
- [ ] Duplicate detection
- [ ] Import summary with counts
- [ ] Error handling for bad format

---

## Story 2.9: Day Boundary Logic (6 AM Pink Marking)

As a user,
I want unmarked habits to turn pink after 6 AM,
So that I'm reminded to log yesterday's habits each morning.

**Acceptance Criteria:**

**Given** it's 6:01 AM on January 16th
**When** the matrix renders
**Then** any habit with "empty" status for January 15th shows as "pink"
**And** January 16th cells remain "empty" (today is not pink)

**Given** it's 5:59 AM on January 16th
**When** the matrix renders
**Then** January 15th cells with "empty" status remain "empty" (not yet pink)
**And** the boundary has not passed

**Given** a user has configured day boundary as 9 AM
**When** it's 9:01 AM
**Then** the pink logic uses 9 AM as the threshold
**And** yesterday's unmarked habits turn pink at 9 AM instead of 6 AM

**Given** a pink cell
**When** I click it
**Then** it cycles normally (pink → complete → missed → empty)
**And** the pink status clears

**Given** a past date cell is "empty" (not yet pink)
**When** the day boundary passes
**Then** the cell automatically updates to "pink"
**And** the change is reflected without page refresh (within 30s poll)

### Visual Specification

- Pink color: #f9a8d4 (pink-300)
- Pink is "accountability nudge" not "error" - gentle tone
- Pink cells are clickable and cycle like any other status
- Pink → Complete → Missed → Empty (pink is treated as empty in cycle)

### Technical Notes

```typescript
// Settings API
GET /api/settings
{ dayBoundaryHour: 6 } // 0-23

// Client-side logic
function isPastBoundary(date: string, boundaryHour: number): boolean {
  const now = new Date();
  const boundary = new Date(date);
  boundary.setDate(boundary.getDate() + 1); // Next day
  boundary.setHours(boundaryHour, 0, 0, 0);
  return now > boundary;
}

// Pink is a computed status, not stored
function getDisplayStatus(entry: HabitEntry | null, date: string, boundaryHour: number): HabitStatus {
  if (!entry || entry.status === 'empty') {
    if (isPastBoundary(date, boundaryHour)) {
      return 'pink';
    }
  }
  return entry?.status || 'empty';
}
```

- Pink is NOT stored in database - computed client-side
- Day boundary setting stored in `settings` table
- Background polling (30s) catches boundary crossings
- Consider timezone handling (use user's local time)

### Definition of Done

- [ ] Day boundary configuration in settings
- [ ] Pink status computed client-side
- [ ] isPastBoundary utility function
- [ ] Pink displays for unmarked past dates
- [ ] Pink cycles like empty status
- [ ] 30s polling catches boundary transitions
- [ ] Settings UI for boundary hour (if time permits, else default 6 AM)

---

## Epic Dependencies

### Depends On (Prerequisites)

- **Epic 1 - Infrastructure & Dashboard**
  - React + Vite frontend initialized
  - Express backend with PostgreSQL connection
  - Drizzle ORM configured
  - TanStack Query client setup
  - react-grid-layout dashboard working
  - Settings API endpoint

### Blocks (Dependents)

- **Epic 3 - Weekly Kanban** (can develop in parallel)
- **Epic 4 - Time Blocks** (habit linking depends on habit API)
- **Epic 7 - Wallboard Mode** (needs Habit Matrix complete)
- **Epic 8 - Mobile Optimization** (matrix responsive already, needs polish)

## Estimation Summary

| Story | Complexity | Estimate |
|-------|------------|----------|
| 2.1 Habit Data Model & API | Medium | 3 hours |
| 2.2 StatusCell Component | Medium | 2 hours |
| 2.3 HabitRow Component | Low | 1.5 hours |
| 2.4 CategoryRow Component | Medium | 2 hours |
| 2.5 HabitMatrix Widget | High | 4 hours |
| 2.6 Status Tooltip | Medium | 2.5 hours |
| 2.7 Scoring Calculation | Medium | 2 hours |
| 2.8 Markdown Import | Medium | 2.5 hours |
| 2.9 Day Boundary Logic | Low | 1.5 hours |
| **Total** | | **~21 hours** |

## Testing Strategy

### Unit Tests (Vitest)

- Score calculation logic
- Day boundary detection
- Markdown parsing
- Status cycle logic

### Integration Tests

- Habit CRUD API endpoints
- Import API with various markdown formats
- Entry creation/update

### E2E Tests (Playwright)

- Click to cycle status
- Hover tooltip appearance
- Category collapse/expand
- Score updates on status change
- Markdown import flow
- Pink status after boundary

## Implementation Notes

### Performance Considerations

- Memoize date arrays to prevent re-renders
- Use React.memo on StatusCell (called 30+ times per row)
- Debounce rapid clicks (300ms) to prevent double-updates
- Virtual scrolling NOT needed for POC (< 50 habits)

### Accessibility Checklist

- [ ] All cells keyboard navigable (arrow keys)
- [ ] Enter/Space activates cells
- [ ] ARIA labels on all status cells
- [ ] Tooltip accessible via keyboard (Tab)
- [ ] Color-blind friendly (patterns + colors)
- [ ] Screen reader announces status changes

### Edge Cases to Handle

- Empty database (first run) - show onboarding prompt
- No habits in a category - hide category or show empty state
- All days in month are N/A - show "—" score gracefully
- Network offline - queue changes, sync on reconnect
- Rapid clicking - debounce to prevent race conditions
