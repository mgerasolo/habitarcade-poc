# Epic 1: Dashboard Infrastructure

## Epic Overview

Establish the foundational architecture for HabitArcade, including the Vite + React + TypeScript frontend, Express API backend, PostgreSQL database with Drizzle ORM, and the 24-column widget dashboard system. This epic creates the scaffolding upon which all four pillars (Habit Matrix, Weekly Kanban, Time Block Priorities, Target Line Graph) will be built.

**Why This Matters:** Without solid infrastructure, every subsequent feature becomes harder to implement. This epic ensures type-safe end-to-end development, reliable data persistence, and a flexible widget system that supports the customizable dashboard vision.

## Priority

**Critical - Week 1 MVP**

This epic must be completed first as all other epics depend on:
- Project structure and build tooling
- Database schema and migrations
- API routes and data fetching patterns
- Widget container and dashboard layout system

## Dependencies

- PostgreSQL via AppServices (external)
- Parker deployment target (10.0.0.34:3451)

## Success Criteria

- [ ] `npm run dev` starts both frontend (Vite) and backend (Express)
- [ ] Database migrations run successfully via Drizzle Kit
- [ ] Dashboard renders with drag-and-drop widget positioning
- [ ] Widget layouts persist to database and restore on page reload
- [ ] API client (TanStack Query) successfully fetches data with caching
- [ ] Error handling displays user-friendly toast notifications

## Requirements Coverage

| Requirement | Description | Story |
|-------------|-------------|-------|
| FR1 | Customizable dashboard with multiple widgets | 1.4, 1.5 |
| FR2 | Drag and drop widgets to reposition | 1.4 |
| FR3 | Resize widgets within grid constraints | 1.4 |
| FR5 | Persist dashboard layout between sessions | 1.6 |
| FR47 | Persist all data to PostgreSQL | 1.2, 1.3 |
| NFR1 | Page initial load < 3 seconds | 1.1, 1.7 |
| NFR2 | UI interactions respond within 100ms | 1.4, 1.5 |
| NFR5 | No data loss - all entries persist to PostgreSQL | 1.2, 1.3 |

---

## Stories

### Story 1.1: Project Scaffolding (Vite + React + TypeScript + Tailwind)

**As a** developer
**I want** a properly configured monorepo with React frontend and Express backend
**So that** I have a solid foundation for building HabitArcade features

**Acceptance Criteria:**

- [ ] **Given** a fresh clone of the repository
      **When** I run `npm install` at the root
      **Then** all dependencies for client and server install successfully

- [ ] **Given** the project is installed
      **When** I run `npm run dev`
      **Then** Vite dev server starts on port 5173 with HMR enabled

- [ ] **Given** the project is installed
      **When** I run `npm run dev:server`
      **Then** Express server starts on port 3451 with TypeScript watch mode

- [ ] **Given** the frontend is running
      **When** I create a `.tsx` component with Tailwind classes
      **Then** Tailwind styles are applied correctly via JIT compilation

- [ ] **Given** TypeScript strict mode is enabled
      **When** I introduce a type error
      **Then** The build fails with a clear error message

**Technical Notes:**

```bash
# Frontend initialization
npm create vite@latest client -- --template react-ts
cd client
npm install -D tailwindcss@^3.4 postcss autoprefixer
npx tailwindcss init -p

# Backend initialization
mkdir server && cd server
npm init -y
npm install express cors
npm install -D typescript @types/express @types/cors tsx
npx tsc --init
```

**Project Structure:**
```
habitarcade-poc/
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css (Tailwind directives)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── shared/
│   └── types.ts
└── package.json (workspace root)
```

**Estimated Effort:** 2-3 hours

---

### Story 1.2: Express API Setup with PostgreSQL Connection

**As a** developer
**I want** an Express API server connected to PostgreSQL
**So that** I can persist and retrieve HabitArcade data

**Acceptance Criteria:**

- [ ] **Given** the server is started
      **When** I make a GET request to `/api/health`
      **Then** I receive `{ status: "ok", database: "connected" }`

- [ ] **Given** PostgreSQL credentials are in environment variables
      **When** the server starts
      **Then** a connection pool is established to the database

- [ ] **Given** CORS is configured
      **When** the frontend makes API requests
      **Then** requests are allowed from localhost:5173

- [ ] **Given** the database connection fails
      **When** the server starts
      **Then** an error is logged and the health endpoint returns `database: "disconnected"`

- [ ] **Given** an invalid JSON body is sent
      **When** an API endpoint processes the request
      **Then** a 400 error with a descriptive message is returned

**Technical Notes:**

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import { db } from './db';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  const dbStatus = await db.checkConnection();
  res.json({ status: 'ok', database: dbStatus ? 'connected' : 'disconnected' });
});

app.listen(3451, () => console.log('Server running on :3451'));
```

**Environment Variables:**
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=habitarcade
POSTGRES_USER=<from AppServices>
POSTGRES_PASSWORD=<from AppServices>
```

**Estimated Effort:** 2-3 hours

---

### Story 1.3: Database Schema (Drizzle ORM Migrations)

**As a** developer
**I want** a complete database schema with Drizzle ORM
**So that** all HabitArcade data models are type-safe and migratable

**Acceptance Criteria:**

- [ ] **Given** Drizzle is configured
      **When** I run `npm run db:generate`
      **Then** SQL migration files are created in `server/drizzle/`

- [ ] **Given** migration files exist
      **When** I run `npm run db:migrate`
      **Then** all tables are created in PostgreSQL

- [ ] **Given** the schema is defined
      **When** I query `db.select().from(habits)`
      **Then** TypeScript infers the correct return type

- [ ] **Given** tables have soft delete columns
      **When** I query without filters
      **Then** deleted items are excluded by default

**Technical Notes:**

```typescript
// server/src/db/schema.ts
import { pgTable, uuid, text, boolean, timestamp, integer, json } from 'drizzle-orm/pg-core';

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category'),
  subcategory: text('subcategory'),
  is_deleted: boolean('is_deleted').default(false),
  deleted_at: timestamp('deleted_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const habitEntries = pgTable('habit_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  habit_id: uuid('habit_id').references(() => habits.id).notNull(),
  date: text('date').notNull(), // YYYY-MM-DD format
  status: text('status').notNull(), // empty, complete, missed, exempt, na, extra, trending_fail, partial, pink
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('todo'), // todo, in_progress, done
  priority: integer('priority').default(0),
  planned_date: text('planned_date'), // YYYY-MM-DD or null for parking lot
  project_id: uuid('project_id').references(() => projects.id),
  parent_task_id: uuid('parent_task_id'),
  is_deleted: boolean('is_deleted').default(false),
  deleted_at: timestamp('deleted_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active'), // active, complete, archived
  is_deleted: boolean('is_deleted').default(false),
  deleted_at: timestamp('deleted_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  linked_habit_id: uuid('linked_habit_id').references(() => habits.id),
  is_deleted: boolean('is_deleted').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const timeBlockPriorities = pgTable('time_block_priorities', {
  id: uuid('id').primaryKey().defaultRandom(),
  time_block_id: uuid('time_block_id').references(() => timeBlocks.id).notNull(),
  title: text('title').notNull(),
  sort_order: integer('sort_order').notNull(),
  is_complete: boolean('is_complete').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  target_start_value: integer('target_start_value'),
  target_end_value: integer('target_end_value'),
  target_start_date: text('target_start_date'),
  target_end_date: text('target_end_date'),
  created_at: timestamp('created_at').defaultNow(),
});

export const measurementEntries = pgTable('measurement_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  measurement_id: uuid('measurement_id').references(() => measurements.id).notNull(),
  date: text('date').notNull(),
  value: integer('value').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: json('value'),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const dashboardLayouts = pgTable('dashboard_layouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').default('default'),
  layout: json('layout').notNull(), // react-grid-layout format
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
```

**Drizzle Config:**
```typescript
// server/drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Estimated Effort:** 3-4 hours

---

### Story 1.4: 24-Column Dashboard with react-grid-layout

**As a** user
**I want** a customizable 24-column dashboard where I can drag and resize widgets
**So that** I can arrange my habit tracking views to match my workflow

**Acceptance Criteria:**

- [ ] **Given** I am on the dashboard page
      **When** the page loads
      **Then** I see a 24-column grid layout with placeholder widgets

- [ ] **Given** widgets are displayed
      **When** I drag a widget
      **Then** the widget moves smoothly and snaps to grid positions

- [ ] **Given** widgets are displayed
      **When** I resize a widget using the corner handle
      **Then** the widget resizes in grid increments

- [ ] **Given** multiple widgets exist
      **When** I drag a widget over another
      **Then** other widgets shift to accommodate (no overlap)

- [ ] **Given** the dashboard is configured
      **When** the window is resized
      **Then** the grid remains responsive and widgets maintain proportions

**Technical Notes:**

```typescript
// client/src/components/Dashboard.tsx
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DEFAULT_LAYOUT = [
  { i: 'habit-matrix', x: 0, y: 0, w: 16, h: 8 },
  { i: 'weekly-kanban', x: 16, y: 0, w: 8, h: 8 },
  { i: 'time-blocks', x: 0, y: 8, w: 8, h: 6 },
  { i: 'target-graph', x: 8, y: 8, w: 8, h: 6 },
];

export function Dashboard() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={24}
      rowHeight={30}
      width={1200}
      onLayoutChange={setLayout}
      draggableHandle=".widget-handle"
      isResizable={true}
    >
      {layout.map((item) => (
        <div key={item.i}>
          <WidgetContainer id={item.i} />
        </div>
      ))}
    </GridLayout>
  );
}
```

**Styling Considerations:**
- Grid background with subtle lines showing columns
- Drag handle in widget header (cursor: grab)
- Resize handle in bottom-right corner
- Minimum widget size: 4 columns x 4 rows
- Maximum widget size: 24 columns x 12 rows

**Estimated Effort:** 4-5 hours

---

### Story 1.5: Widget Container Component

**As a** developer
**I want** a reusable widget container component
**So that** all dashboard widgets have consistent styling and behavior

**Acceptance Criteria:**

- [ ] **Given** a widget is rendered
      **When** I view the widget
      **Then** I see a header with title and a drag handle

- [ ] **Given** a widget is rendered
      **When** I click the expand button
      **Then** the widget opens in full-screen modal view

- [ ] **Given** a widget is in full-screen mode
      **When** I click close or press Escape
      **Then** the widget returns to its dashboard position

- [ ] **Given** a widget's content is loading
      **When** the data is being fetched
      **Then** a skeleton loading state is displayed

- [ ] **Given** a widget encounters an error
      **When** the error occurs
      **Then** an error message with retry button is displayed

**Technical Notes:**

```typescript
// client/src/components/WidgetContainer.tsx
interface WidgetContainerProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function WidgetContainer({
  id,
  title,
  children,
  isLoading,
  error,
  onRetry,
}: WidgetContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="widget-handle flex items-center justify-between px-4 py-2 border-b cursor-grab">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-2">
          <button onClick={() => setIsExpanded(true)} aria-label="Expand">
            <ExpandIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && <WidgetSkeleton />}
        {error && <WidgetError message={error.message} onRetry={onRetry} />}
        {!isLoading && !error && children}
      </div>

      {/* Full-screen modal */}
      {isExpanded && (
        <WidgetModal title={title} onClose={() => setIsExpanded(false)}>
          {children}
        </WidgetModal>
      )}
    </div>
  );
}
```

**Widget Registry:**
```typescript
// client/src/widgets/registry.ts
export const WIDGET_REGISTRY = {
  'habit-matrix': {
    component: HabitMatrix,
    title: 'Habit Matrix',
    defaultSize: { w: 16, h: 8 },
    minSize: { w: 8, h: 4 },
  },
  'weekly-kanban': {
    component: WeeklyKanban,
    title: 'Weekly Kanban',
    defaultSize: { w: 8, h: 8 },
    minSize: { w: 6, h: 4 },
  },
  // ... other widgets
} as const;
```

**Estimated Effort:** 3-4 hours

---

### Story 1.6: Layout Persistence (Save/Restore Widget Positions)

**As a** user
**I want** my dashboard layout to be saved automatically
**So that** my widget arrangement persists between sessions

**Acceptance Criteria:**

- [ ] **Given** I rearrange widgets on the dashboard
      **When** I drag or resize a widget
      **Then** the new layout is saved to the database within 2 seconds (debounced)

- [ ] **Given** I have a saved layout
      **When** I reload the page
      **Then** my previous widget arrangement is restored

- [ ] **Given** I have a saved layout
      **When** I access the dashboard from another device
      **Then** I see the same widget arrangement

- [ ] **Given** the layout API fails
      **When** I try to save
      **Then** the layout is preserved in localStorage as fallback

- [ ] **Given** I want to start fresh
      **When** I click "Reset Layout"
      **Then** the dashboard returns to the default widget positions

**Technical Notes:**

```typescript
// client/src/stores/dashboardStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardStore {
  layout: Layout[];
  setLayout: (layout: Layout[]) => void;
  resetLayout: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      layout: DEFAULT_LAYOUT,
      setLayout: (layout) => set({ layout }),
      resetLayout: () => set({ layout: DEFAULT_LAYOUT }),
    }),
    { name: 'dashboard-layout' } // localStorage key
  )
);
```

```typescript
// client/src/api/dashboard.ts
export function useSaveLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (layout: Layout[]) => {
      const response = await fetch('/api/dashboard/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'layout'] });
    },
  });
}

export function useLoadLayout() {
  return useQuery({
    queryKey: ['dashboard', 'layout'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/layout');
      return response.json();
    },
    staleTime: Infinity, // Layout rarely changes from server
  });
}
```

**API Endpoints:**
- `GET /api/dashboard/layout` - Retrieve saved layout
- `PUT /api/dashboard/layout` - Save layout (debounced from frontend)

**Estimated Effort:** 2-3 hours

---

### Story 1.7: API Client Setup (TanStack Query)

**As a** developer
**I want** a configured TanStack Query client with sensible defaults
**So that** all API calls have consistent caching, error handling, and refetching behavior

**Acceptance Criteria:**

- [ ] **Given** TanStack Query is configured
      **When** multiple components request the same data
      **Then** only one API call is made (request deduplication)

- [ ] **Given** data has been fetched
      **When** I refocus the browser window
      **Then** stale data is refetched automatically

- [ ] **Given** the app is running
      **When** 30 seconds pass
      **Then** background refetch occurs for active queries (polling sync)

- [ ] **Given** a mutation succeeds
      **When** the server responds
      **Then** related queries are automatically invalidated

- [ ] **Given** a query fails
      **When** the error occurs
      **Then** automatic retry happens up to 3 times with exponential backoff

**Technical Notes:**

```typescript
// client/src/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 30, // Poll every 30s for sync
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

```typescript
// client/src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './api/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**API Hooks Pattern:**
```typescript
// client/src/api/habits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api';

export function useHabits(options?: { includeDeleted?: boolean }) {
  return useQuery({
    queryKey: ['habits', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.includeDeleted) params.set('includeDeleted', 'true');
      const response = await fetch(`${API_BASE}/habits?${params}`);
      if (!response.ok) throw new Error('Failed to fetch habits');
      return response.json();
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: CreateHabitInput) => {
      const response = await fetch(`${API_BASE}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habit),
      });
      if (!response.ok) throw new Error('Failed to create habit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
```

**Estimated Effort:** 2-3 hours

---

### Story 1.8: Basic Error Handling and Toast Notifications

**As a** user
**I want** clear feedback when actions succeed or fail
**So that** I understand the state of my data

**Acceptance Criteria:**

- [ ] **Given** I successfully save data
      **When** the API responds with success
      **Then** a green toast notification appears briefly ("Saved!")

- [ ] **Given** an API call fails
      **When** the error occurs
      **Then** a red toast notification shows the error message

- [ ] **Given** a toast is displayed
      **When** 3 seconds pass
      **Then** the toast automatically dismisses

- [ ] **Given** a toast is displayed
      **When** I click the close button
      **Then** the toast dismisses immediately

- [ ] **Given** the network is unavailable
      **When** I try to perform an action
      **Then** I see "Network error. Changes will sync when reconnected."

- [ ] **Given** an unhandled React error occurs
      **When** a component crashes
      **Then** an error boundary displays a friendly message with refresh option

**Technical Notes:**

```typescript
// client/src/components/Toaster.tsx
import { Toaster } from 'react-hot-toast';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        success: {
          style: { background: '#10B981', color: 'white' },
        },
        error: {
          style: { background: '#EF4444', color: 'white' },
          duration: 5000,
        },
      }}
    />
  );
}
```

```typescript
// client/src/api/errorHandler.ts
import toast from 'react-hot-toast';

export function handleApiError(error: unknown) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast.error('Network error. Changes will sync when reconnected.');
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error('An unexpected error occurred');
}
```

```typescript
// client/src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Integration with TanStack Query:**
```typescript
// In mutation hooks
useMutation({
  mutationFn: createHabit,
  onSuccess: () => {
    toast.success('Habit created!');
    queryClient.invalidateQueries({ queryKey: ['habits'] });
  },
  onError: handleApiError,
});
```

**Estimated Effort:** 2-3 hours

---

## Story Summary

| Story | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| 1.1 | Project Scaffolding | 2-3h | None |
| 1.2 | Express API Setup | 2-3h | 1.1 |
| 1.3 | Database Schema | 3-4h | 1.2 |
| 1.4 | 24-Column Dashboard | 4-5h | 1.1 |
| 1.5 | Widget Container | 3-4h | 1.4 |
| 1.6 | Layout Persistence | 2-3h | 1.3, 1.5 |
| 1.7 | API Client Setup | 2-3h | 1.1, 1.2 |
| 1.8 | Error Handling | 2-3h | 1.7 |

**Total Estimated Effort:** 20-28 hours (2.5-3.5 days)

## Implementation Order

```
1.1 Project Scaffolding
    ├── 1.2 Express API Setup
    │   └── 1.3 Database Schema
    │       └── 1.6 Layout Persistence
    ├── 1.4 24-Column Dashboard
    │   └── 1.5 Widget Container
    └── 1.7 API Client Setup
        └── 1.8 Error Handling
```

**Parallel Workstreams:**
- Stories 1.1 → 1.4 → 1.5 (Frontend infrastructure)
- Stories 1.1 → 1.2 → 1.3 (Backend infrastructure)
- Story 1.6 requires both 1.3 and 1.5
- Story 1.7 requires both 1.1 and 1.2

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] TypeScript compiles with no errors (strict mode)
- [ ] Code follows naming conventions from Architecture doc
- [ ] Basic Playwright test for dashboard load
- [ ] No console errors in browser
- [ ] Works in Chrome desktop and Safari iOS
