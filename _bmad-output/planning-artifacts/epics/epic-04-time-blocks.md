# Epic 4: Time Block Priorities

## Epic Overview
Define work blocks with duration and priority lists. Start a timer, see only relevant priorities.

## Priority
**Medium** - Week 1 MVP

## Stories

### Story 4.1: TimeBlock Data Model & API
**As a** developer
**I want** time_blocks and priorities tables
**So that** blocks and their items are stored

**Acceptance Criteria:**
- [ ] time_blocks table: id, name, duration_minutes, linked_habit_id (nullable), created_at, deleted_at
- [ ] priorities table: id, block_id, title, sort_order, completed_at, created_at
- [ ] GET /api/time-blocks - list blocks
- [ ] POST /api/time-blocks - create block
- [ ] PATCH /api/time-blocks/:id - update
- [ ] DELETE /api/time-blocks/:id - soft delete
- [ ] GET /api/time-blocks/:id/priorities - list priorities
- [ ] POST /api/priorities - create priority
- [ ] PATCH /api/priorities/:id - update (complete, reorder)

---

### Story 4.2: TimeBlocks Widget
**As a** user
**I want** to see my time blocks
**So that** I can start focused work sessions

**Acceptance Criteria:**
- [ ] List of time blocks with name + duration
- [ ] Click block to see its priorities
- [ ] Active block highlighted
- [ ] Add new block button
- [ ] Fits in WidgetContainer

---

### Story 4.3: Priority List
**As a** user
**I want** to see and manage priorities for a block
**So that** I know what to work on

**Acceptance Criteria:**
- [ ] Ordered list of priorities
- [ ] Drag to reorder
- [ ] Checkbox to complete
- [ ] Add new priority (quick input)
- [ ] Delete priority

---

### Story 4.4: Timer Component
**As a** user
**I want** a countdown timer for my block
**So that** I stay focused for the duration

**Acceptance Criteria:**
- [ ] Start button begins countdown
- [ ] Shows remaining time (MM:SS)
- [ ] Pause/resume functionality
- [ ] Reset button
- [ ] Visual/audio cue on completion
- [ ] Timer persists if widget unmounts (Zustand store)

---

### Story 4.5: Habit Linking
**As a** user
**I want** timer completion to auto-mark a habit
**So that** time blocks count toward habits

**Acceptance Criteria:**
- [ ] Block can link to a habit (linked_habit_id)
- [ ] When timer completes, prompt to mark habit
- [ ] One-click to mark complete
- [ ] Or dismiss and mark later
- [ ] Shows linked habit name on block

---

## Definition of Done
- Timer runs accurately
- Priorities persist
- Habit linking works end-to-end
