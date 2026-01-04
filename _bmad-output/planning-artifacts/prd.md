---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-complete']
workflowComplete: true
completedAt: '2025-12-29'
lastUpdated: '2026-01-02'
inputDocuments:
  - imports/project-preplan.md
  - imports/sample-habits.md
  - imports/previous-bolt-attmpt.md
workflowType: 'prd'
lastStep: 10
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 3
scopeNotes:
  - "Week 1: Core MVP (4 pillars + infrastructure)"
  - "Week 2: Wallboard mode"
  - "Week 3: Mobile-optimized UI"
  - "Keep markdown-based habit loading"
  - "Carry over scoring logic from Bolt (denominator = live days)"
  - "Soft delete pattern"
  - "Use new status states from preplan (9 states)"
  - "Days not in month: prefer hidden, render greyed if easier"
  - "Habit Matrix + Tasks = 70% priority"
  - "1-2 month learning period"
  - "6 AM day boundary (user setting, global)"
  - "Pink status for unmarked habits past boundary"
  - "Time blocks = work categories with per-block priority lists"
changeLog:
  - date: '2026-01-02'
    changes:
      - "Added parent/child habit relationships (FR58-FR62)"
      - "Added Quotes widget and Quote Library (FR63-FR67)"
      - "Added Video Clips module (FR68-FR71)"
      - "Added right sidebar drawer (FR72-FR74)"
      - "Added edit mode with component management (FR75-FR77)"
      - "Added user-created dashboard pages (FR78-FR80)"
      - "Added widget catalog (FR81-FR82)"
      - "Added maintenance tasks (FR83-FR85)"
      - "Added list/detailed task views (FR86-FR87)"
      - "Clarified cell default state behavior"
---

# Product Requirements Document - habitarcade-poc

**Author:** Matt
**Created:** 2025-12-29
**Last Updated:** 2026-01-02

## Executive Summary

HabitArcade is a gamified habit tracking and task management proof-of-concept. This POC validates core concepts before rebuilding on the AppBrain architecture as part of the Life OS suite.

The system addresses a fundamental behavioral insight: people consistently overestimate how often they perform healthy habits. "I mostly eat healthy" often means "it's been weeks since a good meal." Visual accountability through color-coded tracking creates psychological pressure to maintain consistency.

This is a single-user, no-authentication POC designed for a 1-2 month real-world test period. Desktop-first but mobile-accessible, with all data persisted to PostgreSQL for cross-device access.

### What Makes This Special

**Visual Accountability (Habit Matrix)**
A grid where habits are rows and days are columns. Green for done, red for missed. The friction of marking red creates motivation to "just do it now" rather than skip another day.

**Weekly Kanban (Day Columns)**
Unlike traditional status-based Kanban (To Do → Done), this uses days of the week as columns. Drag tasks between days to visually plan your week. Matches how time-oriented thinkers naturally organize work.

**Time Block Priorities**
Define time blocks ("30 min house cleaning", "20 min coding") with associated priority lists. When you start a block, you see only the top priorities for that context - no distraction from the 50 other things that need doing.

**Parking Lot (Quick Capture)**
Brain dump inbox for tasks and ideas. Log it, get it out of your head, process later. Less structured than GTD inbox - just a fast way to capture before it's forgotten.

**Widget Dashboard Architecture**
24-column grid with drag-and-drop widgets. Mix Habit Matrix, Task Kanban, and other views on a single customizable dashboard.

**Parent/Child Habits** *(Added Jan 2026)*
Hierarchical habit grouping where parent habits roll up status from children. When you complete one child (e.g., "DDPY"), siblings auto-gray (N/A) and parent shows the completed status. Perfect for "Exercise" parent with multiple workout type children.

**Right Sidebar Drawer** *(Added Jan 2026)*
Persistent side panel for quick access to Priorities list, Parking Lot capture, and contextual properties. Always available regardless of which dashboard page you're viewing.

**Quotes & Motivation** *(Added Jan 2026)*
Inspirational quotes widget with a personal quote library. Categorize quotes, display random daily motivation, and build your own collection of meaningful quotes.

## Project Classification

**Technical Type:** web_app
**Domain:** general (productivity/lifestyle)
**Complexity:** low
**Project Context:** Greenfield POC (future Life OS integration)

**Architecture Decisions:**
- React + Vite + Tailwind frontend
- react-grid-layout for 24-column dashboard
- Node.js + Express backend
- PostgreSQL via AppServices
- No authentication (single user)
- Desktop-first, mobile-accessible

## Success Criteria

### User Success

**Primary Outcomes (Life Impact):**
- Daily habit accountability through visual matrix - red squares create action
- Week planning via day-column Kanban - tasks land on specific days
- Focused work sessions via time block priorities - know what to work on now
- Weight loss journey tracking - stay on the target line throughout 2025

**POC Validation:**
- Actually used daily for 1-2 months (not abandoned after week 1)
- Behavioral change observed (habits improved, tasks completed, weight trending)
- UX feels natural vs. fighting the tool

### Business Success (Learning-Focused)

This POC exists to inform the Life OS build:
- What concepts validate and carry forward?
- What needs rethinking before the real build?
- What's the right data model for AppBrain integration?
- What features seemed important but weren't used?

**Not measuring:** Revenue, user growth, market fit (single user POC)

### Technical Success

For a 3-day initial build + 2 weeks iteration:
- Data persists correctly across sessions and devices
- Works on desktop, wallboard (TV), and mobile
- Doesn't crash or lose data
- Widget dashboard allows mixing views on one page

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Initial build | 3 days (Week 1) |
| Wallboard mode | Week 2 |
| Mobile-optimized | Week 3 |
| Daily usage | Most days for 1-2 months |
| Core features working | Habit Matrix, Weekly Kanban, Priorities, Weight Tracker |
| Data integrity | No lost entries |
| Cross-device | Same data on desktop, wallboard, and mobile |

## Product Scope

### Week 1 - MVP (Ready for Jan 1st)

**Must Have (The Four Pillars):**
1. Habit Matrix - monthly grid, status cycling, scoring
2. Weekly Kanban - day columns (Sun-Sat), drag-drop tasks
3. Time Block Priorities - define blocks, see top priorities
4. Target Line Graph - weight tracking against goal line

**Must Have (Infrastructure):**
- 24-column widget dashboard with drag-drop
- PostgreSQL persistence
- Markdown habit import
- Basic task CRUD

### Week 2 - Wallboard Mode

- Full-screen TV/wallboard optimized display
- Dark theme
- Larger fonts/elements for distance viewing
- Interactive (click to cycle statuses)

### Week 3 - Mobile Optimization

- Responsive design for phone/tablet
- Touch-friendly interactions
- Same data, adapted layout

### Growth Features (During POC Test Period)

**Implemented:**
- ✅ Parking Lot quick capture (right sidebar)
- ✅ Quotes widget with Quote Library
- ✅ Video Clips carousel (inspirational shorts)
- ✅ Parent/child habit relationships with rollup
- ✅ Right sidebar drawer (Priorities, Parking Lot, Properties)
- ✅ Edit mode with component drawer
- ✅ Per-habit completion scoring
- ✅ GitHub-style annual contribution graph
- ✅ Habit management page (goals, frequency, links)

**Planned (Open Issues):**
- User-created dashboard pages with customizable modules (#59)
- Widget catalog for browsing/adding widgets (#58)
- Permanent right sidebar with always-visible modules (#57)
- Maintenance Tasks in Manage section (#53)
- List view and detailed view for tasks (#52)
- Edit mode toggle, save, undo in top nav (#48)
- Habit Matrix auto-fill width (#47)

**Deferred:**
- Additional Kanban views (Project, Category, Status columns)
- Event duration trackers (fasting)

### Vision (Life OS - Not This POC)

- Multi-user with Authentik SSO
- AppBrain architecture integration
- Full Life OS suite cross-integration
- Mobile-first companion app

## User Journeys

### Journey 1: Matt's Morning Accountability Check

It's 9:30 AM and Matt just woke up. He grabs his phone and opens HabitArcade before getting out of bed. The dashboard shows yesterday's Habit Matrix with two pink squares - "Evening Pills" and "Reading - 10 min" weren't marked before the 6 AM boundary.

He taps "Evening Pills" - he definitely took those, marks it green. "Reading" - honestly, he skipped it. He marks it red. The pink squares disappear, replaced by honest colors.

Now he glances at today's row in the matrix - all white squares waiting. He checks his Weekly Kanban widget showing today's tasks: "Call insurance company" and "Review PRD with Claude." He also sees his Time Block priorities - the Coding block shows HabitArcade as the #1 priority.

He closes the app knowing exactly what his day looks like.

**Capabilities Revealed:**
- Pink status for unmarked habits past 6 AM boundary
- Morning view showing yesterday's unmarked + today's blank slate
- Dashboard combining Matrix, Kanban, and Priorities widgets
- Quick tap-to-cycle habit status

---

### Journey 2: Matt's Quick Capture Brain Dump

Matt's in the middle of a coding session when he suddenly remembers he needs to schedule a dentist appointment and also that the garage needs organizing before spring. He doesn't want to lose these thoughts but can't deal with them now.

He opens HabitArcade, hits the Parking Lot quick-add, types "Schedule dentist" and hits enter. Types "Organize garage - spring prep" and hits enter. Both items land in the Parking Lot inbox. He closes the app and returns to coding, head clear.

Later during his weekly planning session, he'll drag these into specific days or assign them to projects.

**Capabilities Revealed:**
- Minimal-friction quick capture
- Parking Lot as staging area
- Items can be processed later into Weekly Kanban

---

### Journey 3: Matt's Sunday Planning Session

It's Sunday afternoon. Matt opens HabitArcade on his desktop and expands the Weekly Kanban to full screen. The current week shows tasks scattered across days, with a backlog of unassigned items in the Parking Lot.

He drags "Call insurance company" to Tuesday - that's when he'll have quiet time. "Review PRD" goes to Monday since Claude is ready. He notices three Parking Lot items from the week and processes them - two become tasks on specific days, one he deletes as no longer relevant.

He checks his Time Block priorities - the Coding block still has HabitArcade at #1, with Local AI setup at #2 and LifeOS at #3. House Cleaning block has Living room, then Kitchen, then Organizing garage.

Finally, he glances at the Weight Tracker widget - he's slightly above the target line but within acceptable range. Good enough.

He closes the laptop feeling organized for the week ahead.

**Capabilities Revealed:**
- Weekly Kanban with day columns (Sun-Sat)
- Drag-drop between days and from Parking Lot
- Time blocks as work categories with per-block priority lists
- Target Line Graph for weight
- Full-screen widget expansion

---

### Journey 4: Matt's Time Block Focus Session

It's 2 PM and Matt has 30 minutes before a meeting. He decides to tackle his "Coding" time block. He opens HabitArcade and clicks "Start" on the Coding block.

The screen shifts to focus mode - a timer counting down from 30:00, and his Coding priority list:
1. HabitArcade (current focus)
2. Local AI setup
3. LifeOS system

He spends the 30 minutes on HabitArcade - specifically fixing a bug in the Habit Matrix scoring. When the timer ends, he hasn't finished HabitArcade entirely (it's a multi-day project), but he made progress. He marks his "30 min on Software Projects" habit as green for the day.

**Capabilities Revealed:**
- Time blocks as work categories
- Per-block priority lists (not global)
- Focus mode showing block's priorities
- Timer
- Linking time block completion to habit tracking

---

### Journey 5: Matt's Weight Check-In

It's Wednesday morning. Matt steps off the scale - 378 lbs. He opens HabitArcade and taps the Weight Tracker widget. The Target Line Graph shows his journey: started Jan 1 at 382, goal is 320 by Dec 31.

He adds today's entry: 378. The graph updates - he's slightly below the target line. On track. The widget shows "4 lbs lost, 58 to go" and a green indicator.

He feels good seeing the visual progress and closes the app.

**Capabilities Revealed:**
- Weight entry logging
- Target Line Graph with start/end goals
- Visual on-track/off-track indicator
- Progress summary stats

---

### Journey Requirements Summary

| Journey | Key Capabilities |
|---------|------------------|
| Morning Check | Pink status, dashboard widgets, tap-to-cycle, 6 AM boundary |
| Quick Capture | Parking Lot, minimal friction add, staging area |
| Weekly Planning | Day-column Kanban, drag-drop, per-block priorities, full-screen expand |
| Time Block | Timer, focus mode, block-priority filtering, habit linking |
| Weight Tracking | Entry logging, target line graph, progress indicators |

## Web App Specific Requirements

### Project-Type Overview

HabitArcade is a single-page application (SPA) built with React + Vite. Desktop-first design with mobile accessibility via Safari on iOS.

### Browser Support

| Browser | Platform | Priority |
|---------|----------|----------|
| Chrome | Desktop (primary) | Must support |
| Safari | Mobile/iOS | Must support |
| Firefox | Desktop | Not required for POC |

### Responsive Design

- **Desktop-first**: Primary development target, 24-column widget grid
- **Mobile-accessible**: Same data, adapted layout (Week 3)
- **Wallboard**: TV-optimized view with larger elements (Week 2)

### Performance Targets

| Metric | Target |
|--------|--------|
| Initial load | < 3 seconds |
| Data sync | ~30 seconds between devices (soft target) |
| Interaction response | < 100ms for UI feedback |

### Real-Time Considerations

- Polling-based sync acceptable for POC (30-second interval)
- WebSocket upgrade can be future enhancement
- No strict real-time requirement - refresh-on-load is fallback

### SEO Strategy

Not applicable - single-user POC, no public discovery needed.

### Accessibility

Deferred for POC. Standard semantic HTML practices, no WCAG compliance target.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Validated Learning MVP
**Purpose:** Test habit/task management concepts before Life OS rebuild
**Resource:** Solo developer + AI assistance
**Timeline:** 3-week phased rollout

### Phase 1: Week 1 MVP (Jan 1st Launch)

**The Four Pillars:**
1. **Habit Matrix** - Monthly grid, status cycling (9 states), scoring logic
2. **Weekly Kanban** - Day columns (Sun-Sat), drag-drop tasks
3. **Time Block Priorities** - Per-block priority lists, focus mode, timer
4. **Target Line Graph** - Weight tracking against goal line

**Infrastructure:**
- 24-column widget dashboard (react-grid-layout)
- PostgreSQL persistence
- Markdown habit import
- Basic task CRUD
- 6 AM day boundary logic
- Pink status for unmarked habits

**Flex (Week 1 target, Week 2 fallback):**
- Parking Lot quick capture

### Phase 2: Week 2 (Wallboard)

- Full-screen TV display
- Dark theme
- Larger fonts/elements
- Distance-viewable UI

### Phase 3: Week 3 (Mobile)

- Responsive design for phone/tablet
- Touch-friendly interactions
- Safari iOS support

### Growth Features (If Time Permits)

- Additional Kanban views (Project, Category, Status columns)
- Habit deep-dive (GitHub-style graph)
- Event duration trackers

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Hard limit: 4 pillars for Week 1, everything else waits |
| Data loss | PostgreSQL + regular testing |
| Timeline slip | Cut to 3 pillars if needed (drop Time Blocks first) |

## Functional Requirements

### Dashboard & Widget Management

- FR1: User can view a customizable dashboard with multiple widgets
- FR2: User can drag and drop widgets to reposition them on a 24-column grid
- FR3: User can resize widgets within the grid constraints
- FR4: User can expand any widget to full-screen view
- FR5: System persists dashboard layout between sessions

### Habit Matrix & Tracking

- FR6: User can view habits in a monthly grid (habits as rows, days as columns)
- FR7: User can cycle habit status by clicking/tapping a day cell
- FR8: User can mark habits with 9 status states (Empty, Complete, Missed, Exempt, N/A, Extra, Trending-Fail, Partial, Pink-Unmarked)
- FR9: System displays pink status for habits unmarked past the day boundary
- FR10: User can configure day boundary time (default 6 AM)
- FR11: System calculates habit scores using live-days formula (completed / (days - exemptions - N/A))
- FR12: User can view rollup metrics (percentage completion per habit)
- FR13: User can organize habits into categories and subcategories
- FR14: User can import habits from markdown format
- FR15: User can add, edit, and soft-delete habits
- FR16: System hides days not in the current month (or greys them if easier)

### Task Management

- FR17: User can create tasks with title, description, category, and status
- FR18: User can assign tasks to a specific day (planned date)
- FR19: User can set task priority
- FR20: User can mark tasks as complete
- FR21: User can soft-delete tasks
- FR22: User can assign tasks to projects
- FR23: User can create subtasks under parent tasks

### Weekly Kanban Planning

- FR24: User can view tasks in a weekly Kanban with day columns (Sun-Sat)
- FR25: User can drag tasks between day columns to reschedule
- FR26: User can drag tasks from Parking Lot to day columns
- FR27: User can view current week with navigation to other weeks
- FR28: System displays tasks on their assigned day column

### Time Block & Priority Management

- FR29: User can create time blocks (categories of focused work)
- FR30: User can set duration for each time block
- FR30a: User can link a time block to an existing habit
- FR31: User can create a priority list within each time block
- FR32: User can reorder priorities within a time block
- FR33: User can start a time block session (focus mode)
- FR34: System displays timer countdown during focus mode
- FR35: System shows only the current block's priority list during focus mode
- FR36: System automatically marks linked habit as complete when time block timer finishes

### Measurement & Target Tracking

- FR37: User can create measurements (e.g., weight) with units
- FR38: User can log measurement entries with date and value
- FR39: User can set target goals (start value, end value, start date, end date)
- FR40: System displays target line graph showing progress against goal
- FR41: System indicates on-track/off-track status visually
- FR42: System displays progress summary (amount changed, amount remaining)

### Parking Lot (Quick Capture)

- FR43: User can quickly add items to the Parking Lot
- FR44: User can view all Parking Lot items
- FR45: User can convert Parking Lot items to tasks
- FR46: User can delete Parking Lot items

### Data & Settings

- FR47: System persists all data to PostgreSQL database
- FR48: System syncs data across devices (within ~30 seconds)
- FR49: User can configure global settings (day boundary time)
- FR50: User can view and restore soft-deleted items (habits, tasks)

### Project Management

- FR51: User can create projects with name, description, and status
- FR52: User can edit project details (name, description, status)
- FR53: User can mark projects as complete
- FR54: User can archive projects (soft delete)
- FR55: User can view all projects in a list
- FR56: User can view all tasks grouped by project
- FR57: User can filter tasks by project in Weekly Kanban

### Parent/Child Habit Relationships *(Added Jan 2026 - #61)*

- FR58: User can assign a parent habit to any habit (creating child relationship)
- FR59: System displays parent habits as collapsible group headers with children indented below
- FR60: System displays parent row with "best color" rollup from children (green > partial > etc.)
- FR61: When user marks one child complete, sibling children automatically turn gray (N/A)
- FR62: System excludes parent habits from scoring when children are counted (no double-counting)

### Quotes & Motivation *(Added Jan 2026 - #34)*

- FR63: User can view a Quotes widget displaying inspirational quotes
- FR64: User can add quotes to a personal Quote Library with text, author, and category
- FR65: User can categorize quotes (Motivation, Wisdom, etc.) with proper capitalization
- FR66: System displays random quote from library or curated defaults
- FR67: User can edit and delete quotes from the library

### Video Clips Module *(Added Jan 2026 - #35)*

- FR68: User can view a Video Clips widget with carousel interface
- FR69: User can add video clips by URL (YouTube, etc.)
- FR70: User can categorize and tag video clips
- FR71: User can play clips inline within the widget

### Right Sidebar Drawer *(Added Jan 2026 - #27, #28, #29)*

- FR72: User can open/close a right sidebar drawer from any page
- FR73: Right sidebar displays Priorities list with drag-to-reorder capability
- FR74: Right sidebar displays Parking Lot for quick idea capture

### Edit Mode & Dashboard Management *(Added Jan 2026 - #32, #48)*

- FR75: User can toggle between edit mode and view mode for dashboard
- FR76: In edit mode, right drawer shows available components to add
- FR77: User can save dashboard edits and undo recent layout changes

### User-Created Dashboard Pages *(Planned - #59)*

- FR78: User can create new pages under the Dashboard section
- FR79: User can add/arrange modules on each page independently
- FR80: "Today" is one of the default pages under Dashboard

### Widget Catalog *(Planned - #58)*

- FR81: User can browse a widget catalog to discover available widgets
- FR82: User can add widgets to dashboard directly from the catalog

### Maintenance Tasks *(Planned - #53)*

- FR83: User can access Maintenance Tasks from Manage section
- FR84: User can create recurring maintenance/upkeep tasks
- FR85: System tracks maintenance task completion cycles

### Task View Modes *(Planned - #52)*

- FR86: User can switch between list view and detailed view for tasks
- FR87: List view shows compact task information; detailed view shows full task details

### Habit Matrix Behavior Clarifications *(Added Jan 2026)*

- FR88: Habit Matrix cells start as white/empty (not colored) until user sets a status
- FR89: N/A gray status uses darker shade (~60% black) to distinguish from weekend background
- FR90: Habit Matrix adapts column count to actual days in month (28-31)
- FR91: Hover menus display above all other elements (high z-index)
- FR92: Cell numbers (targets) remain visible when cell is colored

## Non-Functional Requirements

### Performance

- NFR1: Page initial load completes in < 3 seconds on desktop Chrome
- NFR2: UI interactions (clicks, drags) respond within 100ms
- NFR3: Data syncs between devices within ~30 seconds (soft target)
- NFR4: Widget dashboard remains responsive with 6+ widgets visible

### Reliability

- NFR5: No data loss - all user entries persist to PostgreSQL
- NFR6: System handles network interruptions gracefully (queues changes)
- NFR7: Application recovers from browser refresh without data loss

### Data Integrity

- NFR8: Soft-deleted items are recoverable (not permanently destroyed)
- NFR9: Habit history is immutable (past entries cannot be accidentally modified)
- NFR10: Dashboard layout persists between sessions and devices

### Browser Compatibility

- NFR11: Full functionality in Chrome (desktop) and Safari (iOS)
- NFR12: Touch interactions work correctly on mobile Safari

### Testing & Quality Assurance

- NFR13: End-to-end tests use Playwright for browser automation
- NFR14: Critical user journeys have automated test coverage (Morning Check, Weekly Planning, Habit Marking)
- NFR15: Tests run against Chrome and Safari browsers
- NFR16: Test suite runs in CI/CD pipeline before deployment
- NFR17: API endpoints have integration test coverage

## Known Issues & Bugs *(As of Jan 2026)*

Open issues tracked in GitHub that affect current functionality:

| Issue | Severity | Description |
|-------|----------|-------------|
| #54 | Critical | Quotes fail to save - persistence broken |
| #42 | High | Hover menu z-index - getting hidden behind next group |
| #41 | High | Habit Matrix cells start pink instead of white/empty |
| #56 | Medium | N/A gray hard to distinguish on weekend days |
| #44 | Medium | Cell numbers not visible when cell is colored |

## Implementation Status Summary *(As of Jan 2026)*

| Feature Area | Status | Notes |
|--------------|--------|-------|
| Habit Matrix (core) | ✅ Complete | Monthly grid, status cycling, scoring |
| Parent/Child Habits | ✅ Complete | Rollup behavior implemented (#61) |
| Weekly Kanban | ✅ Complete | Day columns, drag-drop |
| Time Blocks | ✅ Complete | Priorities, timer, habit linking |
| Target Line Graph | ✅ Complete | Weight tracking with goal line |
| Parking Lot | ✅ Complete | In right sidebar |
| Quotes Widget | ⚠️ Partial | Widget exists, save broken (#54) |
| Video Clips | ✅ Complete | Carousel implemented |
| Right Sidebar | ✅ Complete | Drawer with priorities/parking lot |
| Edit Mode | ⚠️ Partial | Component drawer works, needs save/undo (#48) |
| Dashboard Pages | 🔲 Planned | User-created pages (#59) |
| Widget Catalog | 🔲 Planned | Browse/add widgets (#58) |
| Maintenance Tasks | 🔲 Planned | Recurring upkeep tasks (#53) |
| Task View Modes | 🔲 Planned | List/detailed views (#52) |
| Wallboard Mode | 🔲 Planned | Week 2 scope |
| Mobile Optimization | 🔲 Planned | Week 3 scope |

