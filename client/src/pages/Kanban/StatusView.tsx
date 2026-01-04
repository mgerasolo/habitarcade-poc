import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import * as MuiIcons from '@mui/icons-material';
import { useTasks, useUpdateTask, useProjects, useTags } from '../../api';
import { TaskCard } from '../../widgets/WeeklyKanban/TaskCard';
import { TaskModal } from '../../widgets/WeeklyKanban/TaskModal';
import type { Task, TaskStatus } from '../../types';

interface StatusColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  color: string;
  onEditTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

/**
 * Droppable column for a specific status
 */
function StatusColumn({
  status,
  title,
  tasks,
  icon,
  color,
  onEditTask,
  onToggleComplete,
}: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-xl overflow-hidden transition-all duration-200
        bg-slate-800/60 border border-slate-700/50
        ${isOver ? 'ring-2 ring-teal-400 bg-teal-900/20' : ''}
      `}
    >
      {/* Column header */}
      <div
        className="px-4 py-3 flex-shrink-0 border-b border-slate-700/50"
        style={{ backgroundColor: `${color}10` }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color }}>{icon}</span>
          <h3 className="font-condensed font-semibold text-white">{title}</h3>
          <span className="text-sm text-slate-400 ml-auto">{tasks.length}</span>
        </div>
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)] p-3 space-y-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onToggleComplete={() => onToggleComplete(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="text-center py-8 text-slate-500 text-sm">
            <MuiIcons.Inbox style={{ fontSize: 32, opacity: 0.5 }} />
            <p className="mt-2">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Status View - Kanban board organized by task status (Pending/Complete)
 * Features:
 * - Drag-drop between status columns
 * - Filter by project, priority, and tags
 */
export function StatusView() {
  // Filter state
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(true);

  // Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: projectsData } = useProjects();
  const { data: tagsData } = useTags();

  const allTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData?.data]);
  const tags = useMemo(() => tagsData?.data ?? [], [tagsData?.data]);

  const updateTask = useUpdateTask();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter and group tasks by status
  const { pendingTasks, completeTasks } = useMemo(() => {
    let filtered = allTasks.filter((t) => !t.isDeleted);

    // Apply project filter
    if (selectedProject) {
      filtered = filtered.filter((t) => t.projectId === selectedProject);
    }

    // Apply priority filter
    if (selectedPriority) {
      const priority = parseInt(selectedPriority, 10);
      filtered = filtered.filter((t) => t.priority === priority);
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter((t) =>
        t.tags?.some((tag) => tag.id === selectedTag)
      );
    }

    // Sort by sortOrder then by creation date
    const sorted = [...filtered].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      pendingTasks: sorted.filter((t) => t.status === 'pending'),
      completeTasks: sorted.filter((t) => t.status === 'complete'),
    };
  }, [allTasks, selectedProject, selectedPriority, selectedTag]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = allTasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [allTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;

      // Check if dropped on a status column
      if (newStatus === 'pending' || newStatus === 'complete') {
        const task = allTasks.find((t) => t.id === taskId);
        if (task && task.status !== newStatus) {
          updateTask.mutate({
            id: taskId,
            status: newStatus,
            completedAt:
              newStatus === 'complete' ? new Date().toISOString() : undefined,
          });
        }
      }
    },
    [allTasks, updateTask]
  );

  const handleToggleComplete = useCallback(
    (task: Task) => {
      const newStatus: TaskStatus =
        task.status === 'complete' ? 'pending' : 'complete';
      updateTask.mutate({
        id: task.id,
        status: newStatus,
        completedAt:
          newStatus === 'complete' ? new Date().toISOString() : undefined,
      });
    },
    [updateTask]
  );

  const clearFilters = useCallback(() => {
    setSelectedProject('');
    setSelectedPriority('');
    setSelectedTag('');
  }, []);

  const hasActiveFilters = selectedProject || selectedPriority || selectedTag;

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <MuiIcons.Sync className="animate-spin mr-2" />
        <span>Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MuiIcons.ViewKanban className="text-teal-400" style={{ fontSize: 28 }} />
            <h1 className="text-xl font-bold text-white font-condensed">Status View</h1>
          </div>

          {/* Toggle completed visibility */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${showCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
              }
            `}
          >
            <MuiIcons.CheckCircle style={{ fontSize: 18 }} />
            {showCompleted ? 'Showing Completed' : 'Hiding Completed'}
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project filter */}
          <div className="flex items-center gap-2">
            <MuiIcons.Folder className="text-slate-400" style={{ fontSize: 18 }} />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <MuiIcons.Flag className="text-slate-400" style={{ fontSize: 18 }} />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Priorities</option>
              <option value="1">P1 - Critical</option>
              <option value="2">P2 - High</option>
              <option value="3">P3 - Normal</option>
              <option value="4">P4 - Low</option>
            </select>
          </div>

          {/* Tag filter */}
          <div className="flex items-center gap-2">
            <MuiIcons.LocalOffer className="text-slate-400" style={{ fontSize: 18 }} />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <MuiIcons.Clear style={{ fontSize: 16 }} />
              Clear filters
            </button>
          )}

          {/* Task count summary */}
          <div className="ml-auto text-sm text-slate-400">
            {pendingTasks.length} pending
            {showCompleted && `, ${completeTasks.length} complete`}
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`
            flex-1 grid gap-4 min-h-0
            ${showCompleted ? 'grid-cols-2' : 'grid-cols-1'}
          `}
        >
          {/* Pending column */}
          <StatusColumn
            status="pending"
            title="Pending"
            tasks={pendingTasks}
            icon={<MuiIcons.PendingActions style={{ fontSize: 22 }} />}
            color="#f59e0b"
            onEditTask={setEditingTask}
            onToggleComplete={handleToggleComplete}
          />

          {/* Complete column */}
          {showCompleted && (
            <StatusColumn
              status="complete"
              title="Complete"
              tasks={completeTasks}
              icon={<MuiIcons.TaskAlt style={{ fontSize: 22 }} />}
              color="#10b981"
              onEditTask={setEditingTask}
              onToggleComplete={handleToggleComplete}
            />
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onToggleComplete={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task edit modal */}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}

export default StatusView;
