# Epic 1: Dashboard Infrastructure

## Epic Overview
Foundation setup: project scaffolding, database, API, and widget dashboard system.

## Priority
**Critical** - Week 1 MVP - Must complete first

## Stories

### Story 1.1: Project Scaffolding
**As a** developer
**I want** the project initialized with Vite + React + TypeScript + Tailwind
**So that** I have a working dev environment

**Acceptance Criteria:**
- [ ] `npm create vite@latest client -- --template react-ts` executed
- [ ] Tailwind CSS 3.4 configured with PostCSS
- [ ] TypeScript strict mode enabled
- [ ] Dev server runs on port 5173
- [ ] Basic App.tsx renders "HabitArcade"

**Technical Notes:**
- Use Roboto Condensed font from Google Fonts
- Configure Tailwind with custom status colors

---

### Story 1.2: Express API Setup
**As a** developer
**I want** an Express server with PostgreSQL connection
**So that** the frontend can persist data

**Acceptance Criteria:**
- [ ] Express server runs on port 3451
- [ ] PostgreSQL connection via pg pool
- [ ] CORS configured for localhost:5173
- [ ] Health check endpoint: GET /api/health
- [ ] Environment variables for DB connection

**Technical Notes:**
- Use tsx for TypeScript execution
- Connection string from .env

---

### Story 1.3: Database Schema
**As a** developer
**I want** Drizzle ORM with initial migrations
**So that** data models are defined and versioned

**Acceptance Criteria:**
- [ ] Drizzle ORM configured with PostgreSQL
- [ ] Tables: habits, habit_entries, tasks, projects, time_blocks, measurements, parking_lot, settings
- [ ] Soft delete columns (deleted_at) on relevant tables
- [ ] Migrations can run via `npm run db:migrate`
- [ ] Seed script for sample data

**Technical Notes:**
- Use Drizzle Kit for migrations
- All IDs as UUID

---

### Story 1.4: Widget Dashboard Layout
**As a** user
**I want** a 24-column drag-drop dashboard
**So that** I can arrange widgets to my preference

**Acceptance Criteria:**
- [ ] react-grid-layout installed and configured
- [ ] 24-column grid system
- [ ] Widgets can be dragged and resized
- [ ] Default layout loads on first visit
- [ ] Minimum widget sizes enforced

**Technical Notes:**
- Use ResponsiveGridLayout for breakpoint handling

---

### Story 1.5: WidgetContainer Component
**As a** developer
**I want** a consistent widget wrapper
**So that** all widgets have uniform styling

**Acceptance Criteria:**
- [ ] WidgetContainer component with title prop
- [ ] Consistent padding (16px)
- [ ] Subtle shadow and gray-50 background
- [ ] Optional actions slot (top-right)
- [ ] Children render in content area

---

### Story 1.6: Layout Persistence
**As a** user
**I want** my dashboard layout saved
**So that** it persists across sessions

**Acceptance Criteria:**
- [ ] Layout saved to database on change
- [ ] Layout restored on page load
- [ ] Settings API endpoint for layout CRUD
- [ ] Debounced save (500ms) to avoid spam

---

### Story 1.7: API Client Setup
**As a** developer
**I want** TanStack Query configured
**So that** data fetching is standardized

**Acceptance Criteria:**
- [ ] QueryClient configured with defaults
- [ ] 30-second stale time
- [ ] Retry on failure (3 attempts)
- [ ] DevTools available in development
- [ ] Custom hooks pattern established

---

### Story 1.8: Toast Notifications
**As a** user
**I want** feedback on actions
**So that** I know when things succeed or fail

**Acceptance Criteria:**
- [ ] react-hot-toast installed
- [ ] Success toast (green) for saves
- [ ] Error toast (red) for failures
- [ ] 3-second auto-dismiss
- [ ] Positioned bottom-right

---

## Definition of Done
- All acceptance criteria checked
- No console errors
- Works on Chrome desktop
