import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, parseISO, addDays, isWithinInterval, startOfDay } from 'date-fns';
import * as MuiIcons from '@mui/icons-material';
import { useTasks, useUpdateTask, useProjects, useTags, useStatuses } from '../../api';
import { TaskModal } from '../../widgets/WeeklyKanban/TaskModal';
import type { Task } from '../../types';

// Three view modes: list (compact), card (enhanced), detailed (table)
type ViewMode = 'list' | 'card' | 'detailed';

interface StatusColumnProps {
  statusId: string;
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  viewMode: ViewMode;
  isCollapsed: boolean;
  movingTaskIds: Set<string>;
  onEditTask: (task: Task) => void;
  onAddTask: (statusId: string) => void;
  onToggleCollapse: (statusId: string) => void;
}

/**
 * List view - compact task row (minimal whiteboard style)
 * Draggable with hover actions (drag handles on both sides + edit button)
 */
function ListTaskRow({
  task,
  onEdit,
  isBeingMoved,
}: {
  task: Task;
  onEdit: () => void;
  isBeingMoved?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isComplete = task.status === 'complete';
  const projectColor = task.project?.color || task.project?.iconColor || '#6366f1';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Disable transition when task is being moved to prevent spring-back animation
    transition: isBeingMoved ? 'none' : transition,
    // Hide completely when being moved optimistically (it will appear in the new column)
    opacity: isDragging ? 0.5 : isBeingMoved ? 0 : 1,
    // Prevent layout shift when hidden
    visibility: isBeingMoved ? 'hidden' as const : 'visible' as const,
  };

  // Drag handle component - reused on both sides
  const DragHandle = (
    <div
      {...attributes}
      {...listeners}
      className={`
        flex-shrink-0 cursor-grab active:cursor-grabbing transition-opacity
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}
      title="Drag to move"
    >
      <MuiIcons.DragIndicator style={{ fontSize: 14 }} className="text-slate-500 hover:text-slate-300" />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-1 py-1 px-1 rounded transition-colors group
        hover:bg-slate-700/30
        ${isComplete ? 'opacity-60' : ''}
        ${isDragging ? 'z-50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left drag handle */}
      {DragHandle}

      {/* Checkbox indicator */}
      <div
        className={`
          w-3 h-3 rounded-sm border flex-shrink-0
          ${isComplete
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-500'
          }
        `}
      />
      {/* Project indicator */}
      {task.project && (
        <div
          className="w-1.5 h-4 rounded-sm flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />
      )}
      {/* Title - clickable area */}
      <span
        onClick={onEdit}
        className={`flex-1 text-sm truncate cursor-pointer ${isComplete ? 'line-through text-slate-500' : 'text-slate-200'}`}
        title={task.title}
      >
        {task.title}
      </span>
      {/* Child count badge */}
      {task.children && task.children.length > 0 && (
        <span
          className="text-[10px] px-1 rounded flex-shrink-0 bg-slate-600/50 text-slate-400"
          title={`${task.children.length} subtask${task.children.length > 1 ? 's' : ''}`}
        >
          <MuiIcons.AccountTree style={{ fontSize: 10, marginRight: 2 }} />
          {task.children.length}
        </span>
      )}
      {/* Priority badge */}
      {task.priority && task.priority <= 2 && (
        <span className={`text-[10px] px-1 rounded flex-shrink-0 ${
          task.priority === 1 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
        }`}>
          P{task.priority}
        </span>
      )}
      {/* Edit button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`
          flex-shrink-0 p-0.5 rounded hover:bg-slate-600/50 transition-opacity
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        title="Edit task"
      >
        <MuiIcons.Edit style={{ fontSize: 12 }} className="text-slate-400 hover:text-teal-400" />
      </button>

      {/* Right drag handle */}
      {DragHandle}
    </div>
  );
}

/**
 * Card view - enhanced task card with more details
 * Shows: title, planned date, project/notes/overdue icons, priority, tags
 */
function CardTaskRow({
  task,
  onEdit,
  isBeingMoved,
}: {
  task: Task;
  onEdit: () => void;
  isBeingMoved?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isComplete = task.status === 'complete';
  const projectColor = task.project?.color || task.project?.iconColor || '#6366f1';

  // Check if task is overdue
  const isOverdue = task.plannedDate && !isComplete && isPast(parseISO(task.plannedDate + 'T23:59:59'));
  const hasDescription = !!task.description;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Disable transition when task is being moved to prevent spring-back animation
    transition: isBeingMoved ? 'none' : transition,
    // Hide completely when being moved optimistically
    opacity: isDragging ? 0.5 : isBeingMoved ? 0 : 1,
    visibility: isBeingMoved ? 'hidden' as const : 'visible' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative rounded-lg border transition-all cursor-pointer
        ${isComplete
          ? 'border-slate-700/50 bg-slate-800/30 opacity-60'
          : 'border-slate-600/50 bg-slate-800/50 hover:border-slate-500/70 hover:bg-slate-700/50'
        }
        ${isDragging ? 'z-50 shadow-lg' : ''}
        ${isOverdue ? 'border-l-2 border-l-red-500' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
    >
      {/* Main content - single row with checkbox and title inline */}
      <div className="relative py-1.5 pl-2.5 pr-1.5">
        {/* Drag handle - absolutely positioned, appears on hover */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className={`absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          title="Drag to move"
        >
          <MuiIcons.DragIndicator style={{ fontSize: 14 }} className="text-slate-500 hover:text-slate-300" />
        </div>

        {/* First row: checkbox, title, indicators, edit button - all inline */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Checkbox - 3.5 = 14px */}
          <div
            className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${isComplete ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}
          />

          {/* Title - directly after checkbox, truncates on overflow */}
          <span
            className={`text-sm leading-tight flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${isComplete ? 'line-through text-slate-500' : 'text-slate-200'}`}
            title={task.title}
          >
            {task.title}
          </span>

          {/* Inline indicators - project, notes, due date, overdue */}
          {task.project && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: projectColor }}
              title={task.project.name}
            />
          )}
          {hasDescription && (
            <MuiIcons.Notes style={{ fontSize: 11 }} className="text-slate-500 flex-shrink-0" titleAccess="Has notes" />
          )}
          {task.plannedDate && !isOverdue && (
            <MuiIcons.Alarm style={{ fontSize: 11 }} className="text-amber-400 flex-shrink-0" titleAccess="Has due date" />
          )}
          {isOverdue && (
            <MuiIcons.Warning style={{ fontSize: 11 }} className="text-red-400 flex-shrink-0" titleAccess="Overdue" />
          )}
          {/* Child count badge */}
          {task.children && task.children.length > 0 && (
            <span
              className="text-[10px] px-1 rounded flex-shrink-0 bg-slate-600/50 text-slate-400"
              title={`${task.children.length} subtask${task.children.length > 1 ? 's' : ''}`}
            >
              <MuiIcons.AccountTree style={{ fontSize: 10, marginRight: 2 }} />
              {task.children.length}
            </span>
          )}

          {/* Edit button - appears on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={`flex-shrink-0 p-0.5 rounded hover:bg-slate-600/50 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            title="Edit task"
          >
            <MuiIcons.Edit style={{ fontSize: 12 }} className="text-slate-400 hover:text-teal-400" />
          </button>
        </div>

        {/* Second row: priority, date, tags - only if present */}
        {(task.plannedDate || (task.priority && task.priority <= 3) || (task.tags && task.tags.length > 0)) && (
          <div className="flex items-center gap-1.5 mt-1 ml-5 flex-wrap">
            {task.priority && task.priority <= 3 && (
              <span className={`text-[10px] px-1 rounded ${
                task.priority === 1 ? 'bg-red-500/20 text-red-400' :
                task.priority === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                P{task.priority}
              </span>
            )}
            {task.plannedDate && (
              <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                <MuiIcons.CalendarToday style={{ fontSize: 10 }} className="mr-0.5 -mt-0.5" />
                {format(parseISO(task.plannedDate), 'MMM d')}
              </span>
            )}
            {task.tags?.slice(0, 2).map(tag => (
              <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400">
                {tag.name}
              </span>
            ))}
            {(task.tags?.length || 0) > 2 && (
              <span className="text-[10px] text-slate-500">+{(task.tags?.length || 0) - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Droppable column - whiteboard style with vertical dividers
 * Supports collapsed state with rotated header
 */
function StatusColumn({
  statusId,
  title,
  tasks,
  icon,
  color,
  isFirst: _isFirst,
  isLast,
  viewMode,
  isCollapsed,
  movingTaskIds,
  onEditTask,
  onAddTask,
  onToggleCollapse,
}: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  });
  const [isHovered, setIsHovered] = useState(false);

  // Collapsed column - narrow with rotated text
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={() => onToggleCollapse(statusId)}
        className={`
          flex flex-col items-center h-full cursor-pointer
          transition-all duration-200 hover:bg-slate-700/30
          ${!isLast ? 'border-r border-slate-600/40' : ''}
        `}
        style={{ width: 28, minWidth: 28, maxWidth: 28 }}
        title={`${title} (${tasks.length}) - Click to expand`}
      >
        {/* Collapsed header with rotated text */}
        <div
          className="flex items-center justify-center py-2 flex-shrink-0 border-b border-slate-600/30 w-full"
          style={{ height: 32 }}
        >
          <span style={{ color }} className="opacity-60">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>, { style: { fontSize: 14 } }) : icon}
          </span>
        </div>
        {/* Rotated title */}
        <div className="flex-1 flex items-start justify-center pt-2 overflow-hidden">
          <span
            className="font-condensed font-medium text-xs text-slate-400 whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {title}
            <span className="text-slate-500 ml-1">({tasks.length})</span>
          </span>
        </div>
      </div>
    );
  }

  // Expanded column
  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-0 h-full transition-all duration-150
        ${!isLast ? 'border-r border-slate-600/40' : ''}
        ${isOver ? 'bg-teal-800/25 ring-2 ring-inset ring-teal-500/40' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column header - minimal with hover actions */}
      <div className={`flex items-center gap-2 px-2 py-1.5 flex-shrink-0 border-b group transition-colors duration-150 ${isOver ? 'bg-teal-700/30 border-teal-500/50' : 'border-slate-600/30'}`}>
        <span style={{ color }} className="opacity-80">{icon}</span>
        <span className="font-condensed font-medium text-sm text-slate-300">{title}</span>
        <span className="text-xs text-slate-500">{tasks.length}</span>

        {/* Hover actions */}
        <div className={`ml-auto flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Hide column button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(statusId);
            }}
            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-orange-400 transition-colors"
            title={`Hide ${title} column`}
          >
            <MuiIcons.VisibilityOff style={{ fontSize: 14 }} />
          </button>
          {/* Add task button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(statusId);
            }}
            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-teal-400 transition-colors"
            title={`Add task to ${title}`}
          >
            <MuiIcons.Add style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Tasks list - scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {viewMode === 'list' ? (
            // Compact list view
            <div className="space-y-0.5">
              {tasks.map((task) => (
                <ListTaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                  isBeingMoved={movingTaskIds.has(task.id)}
                />
              ))}
            </div>
          ) : (
            // Card view with enhanced details
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <CardTaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                  isBeingMoved={movingTaskIds.has(task.id)}
                />
              ))}
            </div>
          )}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="text-center py-4 text-slate-600 text-xs">
            <MuiIcons.Inbox style={{ fontSize: 20, opacity: 0.4 }} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Detailed view - data table with inline editing
 */
function DetailsTable({
  tasks,
  statuses,
  projects,
  tags: _tags,
  onEditTask,
  onUpdateTask,
}: {
  tasks: Task[];
  statuses: { id: string; name: string; color: string }[];
  projects: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onEditTask: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'title' | 'status' | 'priority' | 'project'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filterProject) {
      result = result.filter(t => t.projectId === filterProject);
    }
    if (filterStatus) {
      result = result.filter(t => t.statusId === filterStatus);
    }
    if (filterPriority) {
      result = result.filter(t => t.priority === parseInt(filterPriority));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = (a.statusId || '').localeCompare(b.statusId || '');
          break;
        case 'priority':
          cmp = (a.priority || 99) - (b.priority || 99);
          break;
        case 'project':
          cmp = (a.project?.name || '').localeCompare(b.project?.name || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, filterProject, filterStatus, filterPriority, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === filteredTasks.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <MuiIcons.UnfoldMore style={{ fontSize: 14 }} className="opacity-30" />;
    return sortDir === 'asc'
      ? <MuiIcons.KeyboardArrowUp style={{ fontSize: 14 }} />
      : <MuiIcons.KeyboardArrowDown style={{ fontSize: 14 }} />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 bg-teal-900/30 border-b border-teal-700/30 text-xs">
          <span className="text-teal-400">{selectedRows.size} selected</span>
          <button className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-700/50">
            Bulk Edit
          </button>
          <button
            onClick={() => setSelectedRows(new Set())}
            className="text-slate-500 hover:text-white ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
            <tr className="border-b border-slate-600/30">
              <th className="w-8 px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredTasks.length && filteredTasks.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-slate-500"
                />
              </th>
              <th className="text-left px-2 py-1.5">
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                >
                  Title <SortIcon field="title" />
                </button>
              </th>
              <th className="text-left px-2 py-1.5 w-32">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSort('status')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                  >
                    Status <SortIcon field="status" />
                  </button>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="ml-1 bg-transparent text-xs text-slate-500 border-none focus:ring-0 p-0"
                  >
                    <option value="">▼</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="text-left px-2 py-1.5 w-24">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSort('priority')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                  >
                    Priority <SortIcon field="priority" />
                  </button>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="ml-1 bg-transparent text-xs text-slate-500 border-none focus:ring-0 p-0"
                  >
                    <option value="">▼</option>
                    <option value="1">P1</option>
                    <option value="2">P2</option>
                    <option value="3">P3</option>
                    <option value="4">P4</option>
                  </select>
                </div>
              </th>
              <th className="text-left px-2 py-1.5 w-32">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSort('project')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                  >
                    Project <SortIcon field="project" />
                  </button>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="ml-1 bg-transparent text-xs text-slate-500 border-none focus:ring-0 p-0"
                  >
                    <option value="">▼</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="text-left px-2 py-1.5 w-24">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const status = statuses.find(s => s.id === task.statusId);
              return (
                <tr
                  key={task.id}
                  className={`
                    border-b border-slate-700/20 hover:bg-slate-700/20 cursor-pointer
                    ${selectedRows.has(task.id) ? 'bg-teal-900/20' : ''}
                  `}
                  onClick={() => onEditTask(task)}
                >
                  <td className="px-1 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(task.id)}
                      onChange={() => toggleRowSelection(task.id)}
                      className="rounded border-slate-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <span className={task.status === 'complete' ? 'line-through text-slate-500' : 'text-slate-200'}>
                      {task.title}
                    </span>
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.statusId || ''}
                      onChange={(e) => onUpdateTask(task.id, { statusId: e.target.value })}
                      className="w-full bg-transparent border-none text-xs p-0 focus:ring-0"
                      style={{ color: status?.color || '#94a3b8' }}
                    >
                      {statuses.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.priority || ''}
                      onChange={(e) => onUpdateTask(task.id, { priority: parseInt(e.target.value) || undefined })}
                      className="w-full bg-transparent border-none text-xs p-0 focus:ring-0 text-slate-400"
                    >
                      <option value="">-</option>
                      <option value="1">P1</option>
                      <option value="2">P2</option>
                      <option value="3">P3</option>
                      <option value="4">P4</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 text-slate-400 text-xs">
                    {task.project?.name || '-'}
                  </td>
                  <td className="px-2 py-1">
                    {task.tags?.slice(0, 2).map(tag => (
                      <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400 mr-1">
                        {tag.name}
                      </span>
                    ))}
                    {(task.tags?.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-500">+{(task.tags?.length || 0) - 2}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No tasks match filters
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to render a MUI icon by name
 */
function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return <MuiIcons.Label style={{ fontSize: 16 }} />;
  const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
  return IconComponent ? <IconComponent style={{ fontSize: 16 }} /> : <MuiIcons.Label style={{ fontSize: 16 }} />;
}

/**
 * Status View - Kanban board organized by dynamic task statuses
 * Features:
 * - List view: Compact whiteboard-style rows
 * - Card view: Enhanced cards with dates, icons, priority
 * - Detailed view: Data table with inline editing and Excel-like filters
 * - Drag-drop between status columns
 * - Filter by project, priority, and tags
 */
const STORAGE_KEY_VIEW_MODE = 'statusView:viewMode';

export function StatusView() {
  // View mode toggle - list, card, or detailed (persisted to localStorage)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    if (saved === 'list' || saved === 'card' || saved === 'detailed') {
      return saved;
    }
    return 'list';
  });

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
  }, [viewMode]);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());

  // Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createStatusId, setCreateStatusId] = useState<string>('');

  // Optimistic status updates - immediately show task in new column while API updates
  const [optimisticStatusChanges, setOptimisticStatusChanges] = useState<Map<string, string>>(new Map());

  // Set of task IDs currently being moved (for hiding spring-back animation)
  const movingTaskIds = useMemo(() => new Set(optimisticStatusChanges.keys()), [optimisticStatusChanges]);

  // Handler for adding a new task in a specific column
  const handleAddTask = useCallback((statusId: string) => {
    setCreateStatusId(statusId);
    setIsCreatingTask(true);
  }, []);

  // Handler for closing the create modal
  const handleCloseCreateModal = useCallback(() => {
    setIsCreatingTask(false);
    setCreateStatusId('');
  }, []);

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: statusesData, isLoading: statusesLoading } = useStatuses();
  const { data: projectsData } = useProjects();
  const { data: tagsData } = useTags();

  const allTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
  const allStatuses = useMemo(() => statusesData?.data ?? [], [statusesData?.data]);
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData?.data]);
  const tags = useMemo(() => tagsData?.data ?? [], [tagsData?.data]);

  // Filter to main workflow statuses (non-breakout) sorted by sortOrder
  const workflowStatuses = useMemo(() =>
    allStatuses
      .filter((s) => !s.isBreakout)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [allStatuses]
  );

  // Find "complete" status for legacy task mapping
  const completeStatus = useMemo(() =>
    workflowStatuses.find(s =>
      s.name.toLowerCase() === 'complete' || s.name.toLowerCase() === 'done'
    ),
    [workflowStatuses]
  );

  // Find "To-Do" status for auto-categorizing upcoming tasks
  const todoStatus = useMemo(() =>
    workflowStatuses.find(s =>
      s.name.toLowerCase() === 'to-do' || s.name.toLowerCase() === 'todo'
    ),
    [workflowStatuses]
  );

  const updateTask = useUpdateTask();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter tasks and group by statusId
  // Smart handling:
  // - tasks with status='complete' but no statusId go to Complete column
  // - tasks with plannedDate in next 7 days and no statusId go to To-Do column
  // - child tasks (with parentTaskId) are hidden - they're accessed via parent
  const { tasksByStatus, filteredTasks } = useMemo(() => {
    // First, filter out child tasks - they'll be shown under their parents
    let filtered = allTasks.filter((t) => !t.isDeleted && !t.parentTaskId);

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

    // Helper to check if a date is within the next 7 days
    const isWithinNext7Days = (dateStr: string | null | undefined): boolean => {
      if (!dateStr) return false;
      try {
        const date = parseISO(dateStr);
        const today = startOfDay(new Date());
        const sevenDaysFromNow = addDays(today, 7);
        return isWithinInterval(date, { start: today, end: sevenDaysFromNow });
      } catch {
        return false;
      }
    };

    // Group by statusId with smart handling
    const byStatus: Record<string, Task[]> = {};
    for (const status of workflowStatuses) {
      byStatus[status.id] = [];
    }
    for (const task of sorted) {
      // Check for optimistic status change first (for immediate visual feedback on drag)
      let targetStatusId = optimisticStatusChanges.get(task.id) || task.statusId;

      // Smart legacy handling: if no statusId but status='complete', use complete column
      if (!targetStatusId && task.status === 'complete' && completeStatus) {
        targetStatusId = completeStatus.id;
      }

      // Auto-categorize: if no statusId and plannedDate is in next 7 days, use To-Do column
      if (!targetStatusId && todoStatus && isWithinNext7Days(task.plannedDate)) {
        targetStatusId = todoStatus.id;
      }

      if (targetStatusId && byStatus[targetStatusId]) {
        byStatus[targetStatusId].push(task);
      } else {
        // Tasks without statusId go to first column
        const firstStatus = workflowStatuses[0];
        if (firstStatus) {
          byStatus[firstStatus.id].push(task);
        }
      }
    }

    return { tasksByStatus: byStatus, filteredTasks: sorted };
  }, [allTasks, workflowStatuses, completeStatus, todoStatus, selectedProject, selectedPriority, selectedTag, optimisticStatusChanges]);

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
      const overId = over.id as string;

      // First check if dropped directly on a status column
      let targetStatusId = workflowStatuses.find((s) => s.id === overId)?.id;

      // If not dropped on a column, check if dropped on a task and find its column
      if (!targetStatusId) {
        // Find which column contains the task we dropped on
        for (const [statusId, tasks] of Object.entries(tasksByStatus)) {
          if (tasks.some((t) => t.id === overId)) {
            targetStatusId = statusId;
            break;
          }
        }
      }

      if (targetStatusId) {
        const task = allTasks.find((t) => t.id === taskId);
        // Check against both actual statusId and any existing optimistic change
        const currentStatusId = optimisticStatusChanges.get(taskId) || task?.statusId;
        if (task && currentStatusId !== targetStatusId) {
          // Set optimistic update IMMEDIATELY for instant visual feedback
          setOptimisticStatusChanges(prev => new Map(prev).set(taskId, targetStatusId));

          // Check if this is a "complete" type status (last in workflow)
          const targetStatus = workflowStatuses.find((s) => s.id === targetStatusId);
          const isComplete = targetStatus?.name.toLowerCase() === 'complete' ||
                           targetStatus?.name.toLowerCase() === 'done';
          updateTask.mutate({
            id: taskId,
            statusId: targetStatusId,
            completedAt: isComplete ? new Date().toISOString() : undefined,
          }, {
            onSettled: () => {
              // Clear optimistic update when mutation completes (success or error)
              // React Query will have refetched the actual data by now
              setOptimisticStatusChanges(prev => {
                const next = new Map(prev);
                next.delete(taskId);
                return next;
              });
            },
          });
        }
      }
    },
    [allTasks, workflowStatuses, tasksByStatus, updateTask, optimisticStatusChanges]
  );

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateTask.mutate({ id, ...updates });
  }, [updateTask]);

  const toggleCollapseStatus = useCallback((statusId: string) => {
    setCollapsedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) {
        next.delete(statusId);
      } else {
        next.add(statusId);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedProject('');
    setSelectedPriority('');
    setSelectedTag('');
  }, []);

  const hasActiveFilters = selectedProject || selectedPriority || selectedTag;

  // Calculate total task count
  const totalTasks = Object.values(tasksByStatus).reduce((sum, tasks) => sum + tasks.length, 0);

  if (tasksLoading || statusesLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <MuiIcons.Sync className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Row 1: Status Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <MuiIcons.ViewKanban className="text-teal-400" style={{ fontSize: 22 }} />
          <span className="font-condensed font-semibold text-lg text-slate-200">Status Board</span>
          <span className="text-sm text-slate-500">{totalTasks} tasks</span>

          <div className="flex-1" />

          {/* Add Task button */}
          <button
            onClick={() => handleAddTask(workflowStatuses[0]?.id || '')}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded transition-colors"
          >
            <MuiIcons.Add style={{ fontSize: 16 }} />
            Add Task
          </button>
        </div>
      </div>

      {/* Row 2: View Options */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">VIEW</span>
          <div className="flex items-center bg-slate-800/50 rounded p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MuiIcons.ViewList style={{ fontSize: 14 }} />
              List
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MuiIcons.ViewAgenda style={{ fontSize: 14 }} />
              Card
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MuiIcons.TableRows style={{ fontSize: 14 }} />
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Filters */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-slate-700/30 bg-slate-800/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">FILTER</span>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50"
          >
            <option value="">All Priorities</option>
            <option value="1">P1 - Critical</option>
            <option value="2">P2 - High</option>
            <option value="3">P3 - Normal</option>
            <option value="4">P4 - Low</option>
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700/50"
            >
              <MuiIcons.Clear style={{ fontSize: 12 }} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content area - fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'detailed' ? (
          <DetailsTable
            tasks={filteredTasks}
            statuses={workflowStatuses}
            projects={projects}
            tags={tags}
            onEditTask={setEditingTask}
            onUpdateTask={handleUpdateTask}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full flex">
              {workflowStatuses.map((status, index) => {
                const isCollapsed = collapsedStatuses.has(status.id);
                return (
                  <div
                    key={status.id}
                    className={`h-full ${isCollapsed ? '' : 'flex-1 min-w-0'}`}
                    style={isCollapsed ? { width: 28 } : { minWidth: 150 }}
                  >
                    <StatusColumn
                      statusId={status.id}
                      title={status.name}
                      tasks={tasksByStatus[status.id] ?? []}
                      icon={getIconComponent(status.icon)}
                      color={status.color}
                      isFirst={index === 0}
                      isLast={index === workflowStatuses.length - 1}
                      viewMode={viewMode}
                      isCollapsed={isCollapsed}
                      movingTaskIds={movingTaskIds}
                      onEditTask={setEditingTask}
                      onAddTask={handleAddTask}
                      onToggleCollapse={toggleCollapseStatus}
                    />
                  </div>
                );
              })}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeTask ? (
                <div className="bg-slate-800 rounded px-2 py-1 shadow-lg border border-teal-500/50">
                  <span className="text-sm text-white">{activeTask.title}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Task edit modal */}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      {/* Task create modal */}
      {isCreatingTask && (
        <TaskModal
          defaultStatusId={createStatusId}
          onClose={handleCloseCreateModal}
        />
      )}
    </div>
  );
}

export default StatusView;
