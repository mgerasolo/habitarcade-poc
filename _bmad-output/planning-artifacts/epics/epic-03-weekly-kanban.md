# Epic 3: Weekly Kanban

**Priority:** High (Week 1 MVP)
**Sprint:** Week 1
**Status:** Ready for Implementation

## Epic Goal

Deliver a day-column Kanban board that allows users to visually plan their week by assigning tasks to specific days (Sunday through Saturday) and rescheduling via drag-and-drop. This is one of the "Four Pillars" of the Week 1 MVP, enabling Matt's Sunday Planning Session and daily task management workflows.

## Business Value

The Weekly Kanban addresses a fundamental productivity insight: time-oriented thinkers naturally organize work by **when** they'll do it, not by abstract status categories. Unlike traditional Kanban (To Do -> In Progress -> Done), day columns match how people actually think about their week.

**User Impact:**
- Visual weekly planning with tasks landing on specific days
- Drag-and-drop rescheduling when plans change
- Clear view of daily workload distribution
- Integration with Parking Lot for processing captured ideas

## Requirements Coverage

### Functional Requirements (from PRD)
| FR | Description | Stories |
|----|-------------|---------|
| FR17 | Create tasks with title, description, category, status | 3.1 |
| FR18 | Assign tasks to specific day (planned date) | 3.1, 3.5, 3.6 |
| FR19 | Set task priority | 3.8 |
| FR20 | Mark tasks as complete | 3.7 |
| FR21 | Soft-delete tasks | 3.1, 3.8 |
| FR24 | View tasks in weekly Kanban with day columns (Sun-Sat) | 3.3, 3.4 |
| FR25 | Drag tasks between day columns to reschedule | 3.5 |
| FR26 | Drag tasks from Parking Lot to day columns | 3.5 (integration) |
| FR27 | View current week with navigation to other weeks | 3.4 |
| FR28 | Display tasks on assigned day column | 3.4 |

### Non-Functional Requirements
| NFR | Description | Implementation |
|-----|-------------|----------------|
| NFR1 | Page load < 3 seconds | Efficient task queries, TanStack Query caching |
| NFR2 | UI interactions < 100ms | Optimistic updates on drag-drop |
| NFR5 | No data loss | PostgreSQL persistence |
| NFR8 | Soft-delete recoverable | is_deleted flag, deleted_at timestamp |

## Technical Context

### Architecture References
- **Database Table:** `tasks` (see Architecture section 5.3)
- **API Routes:** `/api/tasks` (GET, POST, PUT, DELETE)
- **Frontend Location:** `client/src/widgets/WeeklyKanban/`
- **State Management:** TanStack Query for server state
- **Drag-and-Drop:** HTML5 Drag and Drop API (native) or @dnd-kit for advanced features

### Component Structure (per Architecture)
```
client/src/widgets/WeeklyKanban/
├── index.tsx           # WeeklyKanban widget (story 3.4)
├── DayColumn.tsx       # Individual day column (story 3.3)
├── TaskCard.tsx        # Task card component (story 3.2)
└── TaskModal.tsx       # Edit/create modal (story 3.8)
```

### Data Model (from Architecture)
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  plannedDate?: string;      // ISO date string (YYYY-MM-DD)
  status: 'pending' | 'complete';
  priority?: number;
  projectId?: string;
  timeBlockId?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Story 3.1: Task Data Model and API Endpoints

As a **developer**,
I want **a robust task data model and REST API**,
So that **the frontend can perform CRUD operations on tasks with proper validation and persistence**.

### Acceptance Criteria

**Given** the server is running
**When** I make a POST request to `/api/tasks` with valid task data
**Then** the task is created and returned with an ID
**And** the response status is 201

**Given** a task exists in the database
**When** I make a GET request to `/api/tasks`
**Then** I receive an array of all non-deleted tasks
**And** deleted tasks are excluded by default

**Given** a task exists in the database
**When** I make a GET request to `/api/tasks/:id`
**Then** I receive the task details
**And** the response includes all task fields

**Given** a task exists in the database
**When** I make a PUT request to `/api/tasks/:id` with updated data
**Then** the task is updated
**And** the `updatedAt` timestamp is refreshed

**Given** a task exists in the database
**When** I make a DELETE request to `/api/tasks/:id`
**Then** the task is soft-deleted (is_deleted = true)
**And** the `deletedAt` timestamp is set
**And** the task no longer appears in default GET requests

**Given** soft-deleted tasks exist
**When** I make a GET request to `/api/tasks?includeDeleted=true`
**Then** deleted tasks are included in the response

### Technical Notes

**Database Schema (Drizzle):**
```typescript
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  plannedDate: date('planned_date'),
  status: varchar('status', { length: 20 }).default('pending'),
  priority: integer('priority'),
  projectId: uuid('project_id').references(() => projects.id),
  timeBlockId: uuid('time_block_id').references(() => timeBlocks.id),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Zod Validation Schema:**
```typescript
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  plannedDate: z.string().date().optional(),
  status: z.enum(['pending', 'complete']).default('pending'),
  priority: z.number().int().min(0).optional(),
  projectId: z.string().uuid().optional(),
  timeBlockId: z.string().uuid().optional(),
});
```

**API Response Format:**
```typescript
// Success (single)
{ data: Task }

// Success (list)
{ data: Task[], count: number }

// Error
{ error: string, code?: string }
```

### Definition of Done
- [ ] Database migration created and applied
- [ ] Drizzle schema defined in `server/src/db/schema.ts`
- [ ] Zod validation schemas in `server/src/validators/task.ts`
- [ ] Express routes in `server/src/routes/tasks.ts`
- [ ] Service layer in `server/src/services/taskService.ts`
- [ ] All endpoints return proper status codes
- [ ] Soft delete pattern implemented
- [ ] API integration tests pass

---

## Story 3.2: TaskCard Component

As a **user**,
I want **to see my tasks as visual cards**,
So that **I can quickly scan task information and identify what needs to be done**.

### Acceptance Criteria

**Given** I am viewing the Weekly Kanban
**When** tasks exist for a day
**Then** each task displays as a card showing the title
**And** completed tasks have a visual distinction (strikethrough or muted style)

**Given** a task card is displayed
**When** I look at the card
**Then** I see the task title prominently
**And** the card has a clean, scannable appearance

**Given** a task is marked as complete
**When** I view the task card
**Then** the card appears visually muted or has strikethrough text
**And** I can still read the title

**Given** a task card exists
**When** I hover over it (desktop)
**Then** the cursor indicates the card is interactive
**And** a subtle hover state appears

### Visual Design (per UX Spec)

```
┌──────────────────────────┐
│ ○ Task title here        │  <- Status indicator + title
│   Optional description...│  <- Truncated if long
└──────────────────────────┘
```

**Styling:**
- Card background: `#ffffff` (white)
- Border: `1px solid #e5e7eb` (gray-200)
- Border radius: `4px`
- Padding: `8px 12px`
- Shadow on hover: `0 2px 4px rgba(0,0,0,0.1)`
- Completed state: `opacity: 0.6`, text strikethrough

### Technical Notes

**Component Interface:**
```typescript
interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  isDragging?: boolean;
}
```

**Drag Attributes:**
- `draggable="true"`
- `data-task-id={task.id}`

### Definition of Done
- [ ] Component created at `client/src/widgets/WeeklyKanban/TaskCard.tsx`
- [ ] Displays task title
- [ ] Shows completed state visual distinction
- [ ] Hover state implemented
- [ ] Draggable attribute set
- [ ] Responsive sizing (fits within column)
- [ ] Accessibility: proper ARIA labels

---

## Story 3.3: DayColumn Component

As a **user**,
I want **each day of the week displayed as a column**,
So that **I can see all my tasks organized by the day I plan to do them**.

### Acceptance Criteria

**Given** I am viewing the Weekly Kanban
**When** the widget loads
**Then** I see 7 columns labeled Sunday through Saturday

**Given** a day column is displayed
**When** I look at the column header
**Then** I see the day name (Sun, Mon, Tue, etc.)
**And** I see the date (e.g., "Dec 29")

**Given** today is visible in the Kanban
**When** I view the columns
**Then** today's column has a highlighted background
**And** it's immediately distinguishable from other days

**Given** tasks exist for a specific day
**When** I view that day's column
**Then** all tasks for that day appear within the column
**And** tasks are stacked vertically

**Given** no tasks exist for a day
**When** I view that day's column
**Then** the column appears empty but maintains its structure
**And** the column is ready to receive dropped tasks

### Visual Design

```
┌─────────────┐
│   Monday    │  <- Day name
│   Dec 30    │  <- Date
├─────────────┤
│ ┌─────────┐ │
│ │ Task 1  │ │  <- TaskCard
│ └─────────┘ │
│ ┌─────────┐ │
│ │ Task 2  │ │
│ └─────────┘ │
│             │  <- Empty space for drops
│             │
└─────────────┘
```

**Styling:**
- Column width: Flexible, min 120px, evenly distributed
- Header background: `#f9fafb` (gray-50)
- Today highlight: `#dbeafe` (blue-100) background
- Min height: `200px` (ensures drop target)
- Border: `1px solid #e5e7eb` between columns

### Technical Notes

**Component Interface:**
```typescript
interface DayColumnProps {
  date: Date;
  dayName: string;
  tasks: Task[];
  isToday: boolean;
  onTaskDrop: (taskId: string, newDate: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onQuickAdd: (title: string, date: string) => void;
}
```

**Date Formatting:**
- Day name: `'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'`
- Date: `date-fns` format `'MMM d'` (e.g., "Dec 30")

### Definition of Done
- [ ] Component created at `client/src/widgets/WeeklyKanban/DayColumn.tsx`
- [ ] Displays day name and date in header
- [ ] Renders TaskCard for each task
- [ ] Today highlighting works correctly
- [ ] Drop zone for drag-and-drop
- [ ] Empty state maintains structure
- [ ] Responsive column sizing

---

## Story 3.4: WeeklyKanban Widget (7 Columns)

As a **user**,
I want **a complete weekly Kanban board showing all 7 days**,
So that **I can plan my entire week at a glance and manage tasks across days**.

### Acceptance Criteria

**Given** I am viewing the dashboard
**When** the WeeklyKanban widget is displayed
**Then** I see all 7 days from Sunday to Saturday

**Given** the current week is displayed
**When** I look at the widget
**Then** I can identify which day is today
**And** the week dates are accurate

**Given** tasks exist in the database
**When** the widget loads
**Then** each task appears in the column matching its `plannedDate`
**And** tasks without a `plannedDate` do not appear (they're in Parking Lot)

**Given** I want to view a different week
**When** I click the navigation arrows
**Then** the widget updates to show the previous or next week
**And** the URL or state reflects the current week

**Given** the widget is on the dashboard
**When** I resize or reposition it via react-grid-layout
**Then** the columns adjust to fill the available space

### Visual Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ Weekly Tasks                                    < Dec 29 - Jan 4 > │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┤
│   Sun   │   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │  Sat   │
│  Dec 29 │  Dec 30 │  Dec 31 │  Jan 1  │  Jan 2  │  Jan 3  │ Jan 4  │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ ┌─────┐ │ ┌─────┐ │         │ ┌─────┐ │         │ ┌─────┐ │        │
│ │Task1│ │ │Task2│ │         │ │Task4│ │         │ │Task5│ │        │
│ └─────┘ │ └─────┘ │         │ └─────┘ │         │ └─────┘ │        │
│         │ ┌─────┐ │         │         │         │         │        │
│         │ │Task3│ │         │         │         │         │        │
│         │ └─────┘ │         │         │         │         │        │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┘
```

### Technical Notes

**Data Fetching:**
```typescript
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks', { week: currentWeekStart }],
  queryFn: () => fetchTasks({
    startDate: currentWeekStart,
    endDate: currentWeekEnd
  }),
  refetchInterval: 30000, // 30-second sync
});
```

**Week Calculation:**
```typescript
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
```

**Widget Props (for react-grid-layout):**
```typescript
interface WeeklyKanbanWidgetProps {
  onExpand?: () => void;
}
```

### Definition of Done
- [ ] Component created at `client/src/widgets/WeeklyKanban/index.tsx`
- [ ] Displays 7 DayColumn components (Sun-Sat)
- [ ] Week navigation (prev/next) works
- [ ] Tasks grouped by `plannedDate`
- [ ] TanStack Query integration with 30s polling
- [ ] Loading skeleton while fetching
- [ ] Empty state message when no tasks
- [ ] Integrates with dashboard layout

---

## Story 3.5: Drag-and-Drop Task Movement

As a **user**,
I want **to drag tasks between day columns**,
So that **I can easily reschedule tasks when my plans change**.

### Acceptance Criteria

**Given** a task card in a day column
**When** I start dragging the card
**Then** the card shows a dragging visual state
**And** the original position shows a placeholder

**Given** I am dragging a task
**When** I hover over a different day column
**Then** the target column shows a visual indicator (drop zone highlight)
**And** I can see where the task will land

**Given** I am dragging a task over a valid drop zone
**When** I release the drag
**Then** the task moves to the new day column immediately (optimistic update)
**And** the task's `plannedDate` is updated in the database

**Given** I am dragging a task
**When** I release outside any valid drop zone
**Then** the task returns to its original position
**And** no changes are made

**Given** the network request fails after dropping
**When** the mutation fails
**Then** the task returns to its original position
**And** an error toast appears

### Visual Design

**Drag States:**
- Dragging: Card slightly elevated (shadow), 0.8 opacity
- Drop zone active: Column background changes to `#e0f2fe` (blue-100)
- Invalid drop: Cursor shows "not-allowed"
- Successful drop: Brief flash animation

### Technical Notes

**Implementation Options:**
1. **HTML5 Drag and Drop API** (simpler, native)
2. **@dnd-kit** (more features, better mobile support)

**Recommended: @dnd-kit** for better UX and future mobile support.

```typescript
// Using @dnd-kit
import { DndContext, DragEndEvent } from '@dnd-kit/core';

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const taskId = active.id as string;
    const newDate = over.id as string; // Column date

    // Optimistic update
    queryClient.setQueryData(['tasks', { week }], (old) => {
      return old.map(task =>
        task.id === taskId
          ? { ...task, plannedDate: newDate }
          : task
      );
    });

    // Server mutation
    updateTaskMutation.mutate({ taskId, plannedDate: newDate });
  }
};
```

**Optimistic Update Pattern:**
```typescript
const updateTaskMutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (variables) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks', { week }]);
    // Optimistic update here
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['tasks', { week }], context.previous);
    toast.error('Failed to move task');
  },
  onSettled: () => {
    queryClient.invalidateQueries(['tasks']);
  },
});
```

### Definition of Done
- [ ] Drag initiation works on TaskCard
- [ ] Visual feedback during drag
- [ ] Drop zone highlighting on DayColumn
- [ ] Optimistic update on drop
- [ ] Server mutation fires
- [ ] Error handling with rollback
- [ ] Touch support (mobile)
- [ ] Keyboard accessibility (move with arrows)

---

## Story 3.6: Quick Task Creation (Inline Add)

As a **user**,
I want **to quickly add a task to a specific day**,
So that **I can capture tasks with minimal friction during planning sessions**.

### Acceptance Criteria

**Given** I am viewing a day column
**When** I click the "+" button or "Add task" area
**Then** an inline input field appears in that column

**Given** the inline input is visible
**When** I type a task title and press Enter
**Then** a new task is created with that title
**And** the task is assigned to that day's date
**And** the input clears and is ready for another task

**Given** the inline input is visible
**When** I press Escape or click outside
**Then** the input closes without creating a task

**Given** I enter an empty title
**When** I press Enter
**Then** no task is created
**And** the input remains active with focus

**Given** I create a task via quick add
**When** the task is created
**Then** it appears at the bottom of the day's task list
**And** the server mutation runs in the background

### Visual Design

```
┌─────────────┐
│   Monday    │
│   Dec 30    │
├─────────────┤
│ ┌─────────┐ │
│ │ Task 1  │ │
│ └─────────┘ │
│             │
│ ┌─────────┐ │
│ │+ Add... │ │  <- Click to activate
│ └─────────┘ │
└─────────────┘

Active state:
│ ┌─────────┐ │
│ │[       ]│ │  <- Input field, auto-focused
│ └─────────┘ │
```

**Styling:**
- Add button: Muted text, dashed border
- Input: Solid border, auto-focus
- Placeholder: "Add a task..."

### Technical Notes

**Component State:**
```typescript
const [isAdding, setIsAdding] = useState(false);
const [newTaskTitle, setNewTaskTitle] = useState('');
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (isAdding && inputRef.current) {
    inputRef.current.focus();
  }
}, [isAdding]);

const handleSubmit = () => {
  if (newTaskTitle.trim()) {
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      plannedDate: dayDate,
    });
    setNewTaskTitle('');
    // Keep input open for multiple adds
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') handleSubmit();
  if (e.key === 'Escape') setIsAdding(false);
};
```

### Definition of Done
- [ ] Add button/area in each DayColumn
- [ ] Click activates inline input
- [ ] Enter creates task with day's date
- [ ] Escape cancels without saving
- [ ] Input clears after creation (ready for next)
- [ ] Optimistic update for instant display
- [ ] Empty title validation
- [ ] Keyboard navigation support

---

## Story 3.7: Task Completion Toggle

As a **user**,
I want **to mark tasks as complete or incomplete**,
So that **I can track my progress and see what's finished**.

### Acceptance Criteria

**Given** a task card is displayed
**When** I click the completion checkbox/indicator
**Then** the task status toggles (pending <-> complete)
**And** the visual state updates immediately

**Given** I mark a task as complete
**When** the status changes
**Then** the card shows completed styling (muted, strikethrough)
**And** the task remains in its day column

**Given** I mark a completed task as incomplete
**When** I click the completion indicator again
**Then** the task returns to normal styling
**And** the status is updated to 'pending'

**Given** I toggle a task's status
**When** the server update fails
**Then** the status reverts to its previous state
**And** an error toast appears

### Visual Design

**Completion Indicator:**
- Pending: Empty circle outline `○`
- Complete: Filled checkmark `✓` in circle

**Card States:**
- Pending: Full opacity, normal text
- Complete: 0.6 opacity, strikethrough title

### Technical Notes

**Component Implementation:**
```typescript
const handleToggleComplete = (taskId: string) => {
  const task = tasks.find(t => t.id === taskId);
  const newStatus = task.status === 'complete' ? 'pending' : 'complete';

  toggleMutation.mutate({ taskId, status: newStatus });
};

const toggleMutation = useMutation({
  mutationFn: ({ taskId, status }) =>
    updateTask(taskId, { status }),
  onMutate: async ({ taskId, status }) => {
    // Optimistic update
    queryClient.setQueryData(['tasks', { week }], old =>
      old.map(t => t.id === taskId ? { ...t, status } : t)
    );
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['tasks', { week }], context.previous);
    toast.error('Failed to update task');
  },
});
```

### Definition of Done
- [ ] Clickable completion indicator on TaskCard
- [ ] Toggle between pending/complete states
- [ ] Visual state updates instantly (optimistic)
- [ ] Server mutation fires
- [ ] Error handling with rollback
- [ ] Completed tasks stay in their column
- [ ] Accessible (keyboard, screen reader)

---

## Story 3.8: Task Editing Modal/Inline

As a **user**,
I want **to edit task details including title, description, and priority**,
So that **I can refine tasks and add context as needed**.

### Acceptance Criteria

**Given** a task card is displayed
**When** I click on the card (not the completion toggle)
**Then** an edit modal/panel opens

**Given** the edit modal is open
**When** I view the modal
**Then** I see the task title (editable)
**And** I see the task description (editable, optional)
**And** I see a delete option

**Given** I am editing a task
**When** I change the title and click Save
**Then** the task updates with the new title
**And** the modal closes
**And** the card reflects the changes

**Given** I am editing a task
**When** I click Delete
**Then** a confirmation appears (or soft-delete directly)
**And** the task is soft-deleted
**And** the task disappears from the Kanban

**Given** I am editing a task
**When** I press Escape or click outside
**Then** the modal closes
**And** unsaved changes are discarded

### Visual Design

**Modal Layout:**
```
┌────────────────────────────────────┐
│ Edit Task                      [X] │
├────────────────────────────────────┤
│ Title:                             │
│ ┌────────────────────────────────┐ │
│ │ Call insurance company         │ │
│ └────────────────────────────────┘ │
│                                    │
│ Description:                       │
│ ┌────────────────────────────────┐ │
│ │ Need to update policy for      │ │
│ │ the new year...                │ │
│ └────────────────────────────────┘ │
│                                    │
│ [Delete]                 [Cancel] [Save] │
└────────────────────────────────────┘
```

### Technical Notes

**Modal State (Zustand):**
```typescript
// In uiStore.ts
interface UIStore {
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
}
```

**Form Handling:**
```typescript
const { register, handleSubmit, reset } = useForm<TaskFormData>({
  defaultValues: {
    title: task.title,
    description: task.description || '',
  },
});

const onSubmit = (data: TaskFormData) => {
  updateMutation.mutate({
    taskId: task.id,
    ...data
  });
  setEditingTask(null);
};

const handleDelete = () => {
  deleteMutation.mutate(task.id);
  setEditingTask(null);
};
```

**Delete Mutation:**
```typescript
const deleteMutation = useMutation({
  mutationFn: (taskId: string) => deleteTask(taskId),
  onSuccess: () => {
    queryClient.invalidateQueries(['tasks']);
    toast.success('Task deleted');
  },
});
```

### Definition of Done
- [ ] Component created at `client/src/widgets/WeeklyKanban/TaskModal.tsx`
- [ ] Click on task card opens modal
- [ ] Title field editable
- [ ] Description field editable
- [ ] Save updates task and closes modal
- [ ] Cancel/Escape closes without saving
- [ ] Delete soft-deletes the task
- [ ] Form validation (title required)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Modal accessible (focus trap, ARIA)

---

## Story Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  3.1 Task Data Model ──────────────────┐                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  3.2 TaskCard ──────────────────► 3.3 DayColumn             │
│         │                              │                     │
│         │                              ▼                     │
│         │                      3.4 WeeklyKanban Widget       │
│         │                              │                     │
│         ▼                              ▼                     │
│  3.7 Completion Toggle ◄────── 3.5 Drag-and-Drop            │
│         │                              │                     │
│         ▼                              ▼                     │
│  3.8 Task Editing ◄─────────── 3.6 Quick Add                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Implementation Order:**
1. **3.1** - Task Data Model (foundation)
2. **3.2** - TaskCard (atomic component)
3. **3.3** - DayColumn (container component)
4. **3.4** - WeeklyKanban Widget (integration)
5. **3.5** - Drag-and-Drop (core interaction)
6. **3.6** - Quick Add (convenience feature)
7. **3.7** - Completion Toggle (can be done in parallel with 3.5/3.6)
8. **3.8** - Task Editing (final polish)

---

## Testing Strategy

### Unit Tests
- Task Zod validation schemas
- Date utility functions (week calculation, formatting)
- Task filtering by date range

### Integration Tests
- API endpoint responses
- Database CRUD operations
- Soft delete behavior

### E2E Tests (Playwright)
```typescript
// tests/kanban.spec.ts
test('can drag task to different day', async ({ page }) => {
  // Create a task for Monday
  // Drag to Wednesday
  // Verify task appears in Wednesday column
  // Verify API was called with new date
});

test('quick add creates task in correct day', async ({ page }) => {
  // Click add in Tuesday column
  // Type task title, press Enter
  // Verify task appears in Tuesday
});

test('completing task shows visual change', async ({ page }) => {
  // Click completion toggle
  // Verify strikethrough/muted style
  // Verify task stays in same column
});
```

---

## Estimation

| Story | Complexity | Estimate |
|-------|------------|----------|
| 3.1 Task Data Model | Medium | 3 hours |
| 3.2 TaskCard | Low | 2 hours |
| 3.3 DayColumn | Low | 2 hours |
| 3.4 WeeklyKanban Widget | Medium | 3 hours |
| 3.5 Drag-and-Drop | High | 4 hours |
| 3.6 Quick Add | Low | 2 hours |
| 3.7 Completion Toggle | Low | 1 hour |
| 3.8 Task Editing | Medium | 3 hours |
| **Total** | | **20 hours** |

---

## Open Questions

1. **Drag-and-drop library:** Confirm @dnd-kit vs native HTML5 DnD (recommend @dnd-kit for mobile support)
2. **Week start day:** Sunday (US) vs Monday (ISO) - confirmed Sunday per UX spec
3. **Completed tasks location:** Stay in day column vs move to "Done" area - confirmed stay in column
4. **Parking Lot integration:** Will Story 3.5 include Parking Lot as drag source, or is that a separate epic?

---

## Related Documentation

- **PRD:** FR17-28 (Task Management, Weekly Kanban)
- **Architecture:** Section 5.3 (Database), Section 4.3 (API Routes)
- **UX Spec:** Weekly Planning Session journey, Drag-and-Drop patterns
