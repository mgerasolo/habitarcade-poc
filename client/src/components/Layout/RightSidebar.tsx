import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useUIStore, useDashboardStore } from '../../stores';
import type { RightSidebarModuleType } from '../../stores';
import { useTasks } from '../../api';
import * as MuiIcons from '@mui/icons-material';
import { PrioritiesList } from './PrioritiesList';
import { ComponentPicker } from './ComponentPicker';
import type { Task } from '../../types';
import { format } from 'date-fns';

// Parking Lot types and localStorage key
interface ParkingLotItem {
  id: string;
  text: string;
  createdAt: number;
}

const PARKING_LOT_STORAGE_KEY = 'habitarcade-parking-lot';

interface RightSidebarProps {
  isOpen: boolean;
}

// Module metadata for display
const MODULE_META: Record<
  RightSidebarModuleType,
  { label: string; icon: keyof typeof MuiIcons; description: string }
> = {
  'todays-todos': {
    label: "Today's Todos",
    icon: 'Today',
    description: 'Tasks scheduled for today',
  },
  'parking-lot': {
    label: 'Parking Lot',
    icon: 'LocalParking',
    description: 'Quick capture for ideas to process later',
  },
  'priorities': {
    label: 'Priorities',
    icon: 'PriorityHigh',
    description: 'Time block priorities',
  },
  'quick-entry': {
    label: 'Quick Entry',
    icon: 'FlashOn',
    description: 'Quickly add habits, tasks, or notes',
  },
  'task-backlog': {
    label: 'Task Backlog',
    icon: 'Inbox',
    description: 'Unassigned tasks',
  },
  'components': {
    label: 'Components',
    icon: 'Widgets',
    description: 'Dashboard widget picker',
  },
};

// All available modules for the module picker
const ALL_MODULES: RightSidebarModuleType[] = [
  'todays-todos',
  'parking-lot',
  'priorities',
  'quick-entry',
  'task-backlog',
  'components',
];

export function RightSidebar({ isOpen }: RightSidebarProps) {
  const {
    rightSidebarModules,
    rightSidebarExpandedModules,
    toggleModuleExpanded,
    addRightSidebarModule,
    removeRightSidebarModule,
    toggleRightSidebar,
  } = useUIStore();
  const { isEditMode } = useDashboardStore();
  const [showModulePicker, setShowModulePicker] = useState(false);

  // Modules to display (filter out 'components' unless in edit mode)
  const visibleModules = useMemo(() => {
    return rightSidebarModules.filter(
      (m) => m !== 'components' || isEditMode
    );
  }, [rightSidebarModules, isEditMode]);

  // Available modules to add
  const availableModules = useMemo(() => {
    return ALL_MODULES.filter(
      (m) => !rightSidebarModules.includes(m) && (m !== 'components' || isEditMode)
    );
  }, [rightSidebarModules, isEditMode]);

  const renderModuleContent = (moduleType: RightSidebarModuleType) => {
    switch (moduleType) {
      case 'todays-todos':
        return <TodaysTodosContent />;
      case 'parking-lot':
        return <ParkingLotContent />;
      case 'priorities':
        return <PrioritiesContent />;
      case 'quick-entry':
        return <QuickEntryContent />;
      case 'task-backlog':
        return <TaskBacklogContent />;
      case 'components':
        return <ComponentPicker />;
      default:
        return null;
    }
  };

  return (
    <aside
      data-testid="right-sidebar"
      className={`
        fixed right-0 top-16 h-[calc(100vh-4rem)]
        bg-slate-800/95 backdrop-blur-md border-l border-slate-700/50
        transition-all duration-300 ease-in-out z-40
        flex flex-col
        ${isOpen ? 'w-80' : 'w-0 overflow-hidden'}
      `}
      role="complementary"
      aria-label="Right sidebar"
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Modules</h2>
        <div className="flex items-center gap-1">
          {/* Add module button */}
          <button
            onClick={() => setShowModulePicker(!showModulePicker)}
            className={`
              w-7 h-7 flex items-center justify-center rounded-lg
              transition-colors
              ${showModulePicker
                ? 'bg-teal-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
              }
            `}
            aria-label="Add module"
            title="Add module"
            data-testid="add-module-button"
          >
            <MuiIcons.Add style={{ fontSize: 18 }} />
          </button>
          {/* Collapse button - uses MDI page-layout-sidebar-right icon */}
          <button
            onClick={toggleRightSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors group"
            aria-label="Collapse sidebar"
            data-testid="sidebar-collapse-button"
            title="Collapse panel"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[18px] h-[18px] group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              <path d="M21 3H3C2.45 3 2 3.45 2 4V20C2 20.55 2.45 21 3 21H21C21.55 21 22 20.55 22 20V4C22 3.45 21.55 3 21 3M20 19H17V5H20V19Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Module picker dropdown */}
      {showModulePicker && availableModules.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
          <p className="text-xs text-slate-400 mb-2">Add a module:</p>
          <div className="space-y-1">
            {availableModules.map((moduleType) => {
              const meta = MODULE_META[moduleType];
              const IconComponent = MuiIcons[meta.icon] as React.ComponentType<{
                style?: React.CSSProperties;
                className?: string;
              }>;
              return (
                <button
                  key={moduleType}
                  onClick={() => {
                    addRightSidebarModule(moduleType);
                    setShowModulePicker(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-left"
                  data-testid={`add-module-${moduleType}`}
                >
                  <IconComponent style={{ fontSize: 16 }} className="text-teal-400" />
                  <span className="text-xs font-medium">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showModulePicker && availableModules.length === 0 && (
        <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
          <p className="text-xs text-slate-400">All modules are already added.</p>
        </div>
      )}

      {/* Scrollable modules container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" data-testid="modules-container">
        {visibleModules.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            <MuiIcons.Widgets style={{ fontSize: 32 }} className="mb-2 opacity-50" />
            <p>No modules added</p>
            <p className="text-xs mt-1">Click + to add modules</p>
          </div>
        ) : (
          visibleModules.map((moduleType) => {
            const meta = MODULE_META[moduleType];
            const isExpanded = rightSidebarExpandedModules.has(moduleType);
            const IconComponent = MuiIcons[meta.icon] as React.ComponentType<{
              style?: React.CSSProperties;
              className?: string;
            }>;

            return (
              <div
                key={moduleType}
                className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden"
                data-testid={`module-${moduleType}`}
              >
                {/* Module header */}
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => toggleModuleExpanded(moduleType)}
                  data-testid={`module-header-${moduleType}`}
                >
                  <div className="flex items-center gap-2">
                    <IconComponent
                      style={{ fontSize: 16 }}
                      className="text-teal-400"
                    />
                    <span className="text-sm font-medium text-slate-200">
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRightSidebarModule(moduleType);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                      aria-label={`Remove ${meta.label}`}
                      title="Remove module"
                    >
                      <MuiIcons.Close style={{ fontSize: 12 }} />
                    </button>
                    {/* Expand/collapse indicator */}
                    <MuiIcons.ChevronRight
                      style={{ fontSize: 18 }}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Module content */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-slate-600/30">
                    {renderModuleContent(moduleType)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ============ Module Content Components ============

/**
 * Today's Todos - Shows tasks scheduled for today
 */
function TodaysTodosContent() {
  const { data: tasksData, isLoading } = useTasks();
  const { openModal, setSelectedTask } = useUIStore();

  const todaysTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasksData.data.filter(
      (task: Task) =>
        task.plannedDate === today && !task.isDeleted && task.status !== 'complete'
    );
  }, [tasksData?.data]);

  const completedToday = useMemo(() => {
    if (!tasksData?.data) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasksData.data.filter(
      (task: Task) =>
        task.plannedDate === today && !task.isDeleted && task.status === 'complete'
    );
  }, [tasksData?.data]);

  if (isLoading) {
    return (
      <div className="py-2 text-center text-slate-400 text-xs">Loading...</div>
    );
  }

  return (
    <div className="pt-2 space-y-2" data-testid="todays-todos-content">
      {todaysTasks.length === 0 && completedToday.length === 0 ? (
        <div className="text-center text-slate-500 text-xs py-2">
          <MuiIcons.TaskAlt style={{ fontSize: 24 }} className="mb-1 opacity-50" />
          <p>No tasks for today</p>
        </div>
      ) : (
        <>
          {/* Pending tasks */}
          {todaysTasks.map((task: Task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                openModal('task-form', { task });
              }}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors group"
              data-testid="todays-task"
            >
              <div className="w-4 h-4 mt-0.5 rounded border-2 border-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 truncate">{task.title}</p>
                {task.project && (
                  <p className="text-[10px] text-slate-500 truncate">
                    {task.project.name}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Completed tasks */}
          {completedToday.length > 0 && (
            <div className="pt-2 border-t border-slate-600/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                Completed ({completedToday.length})
              </p>
              {completedToday.slice(0, 3).map((task: Task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 p-1.5 rounded text-slate-500"
                >
                  <MuiIcons.CheckCircle
                    style={{ fontSize: 14 }}
                    className="text-teal-500 mt-0.5"
                  />
                  <p className="text-xs line-through truncate">{task.title}</p>
                </div>
              ))}
              {completedToday.length > 3 && (
                <p className="text-[10px] text-slate-500 pl-6">
                  +{completedToday.length - 3} more
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick add */}
      <button
        onClick={() => openModal('task-form')}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-white text-xs transition-colors"
      >
        <MuiIcons.Add style={{ fontSize: 14 }} />
        <span>Add task</span>
      </button>
    </div>
  );
}

/**
 * Parking Lot - Quick capture for ideas
 */
function ParkingLotContent() {
  const [items, setItems] = useState<ParkingLotItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PARKING_LOT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load parking lot items:', error);
    }
  }, []);

  // Save items to localStorage whenever they change
  const saveItems = useCallback((newItems: ParkingLotItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(PARKING_LOT_STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to save parking lot items:', error);
    }
  }, []);

  // Add a new item
  const addItem = useCallback(() => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newItem: ParkingLotItem = {
      id: `parking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: trimmedText,
      createdAt: Date.now(),
    };

    saveItems([newItem, ...items]);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, items, saveItems]);

  // Delete an item
  const deleteItem = useCallback(
    (id: string) => {
      saveItems(items.filter((item) => item.id !== id));
    },
    [items, saveItems]
  );

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="pt-2 space-y-2" data-testid="parking-lot-content">
      {/* Quick input */}
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick idea..."
          className="flex-1 px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500"
          data-testid="parking-lot-input"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="px-2 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          data-testid="parking-lot-add-button"
        >
          <MuiIcons.Add style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto" data-testid="parking-lot-list">
        {items.length === 0 ? (
          <div className="py-2 text-center text-slate-500 text-xs">
            <p>No parked ideas yet</p>
          </div>
        ) : (
          items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-1.5 p-1.5 bg-slate-700/30 rounded group"
              data-testid="parking-lot-item"
            >
              <MuiIcons.LightbulbOutlined
                style={{ fontSize: 12 }}
                className="text-yellow-400 mt-0.5 flex-shrink-0"
              />
              <span className="flex-1 text-xs text-slate-300 break-words" data-testid="parking-lot-item-text">
                {item.text}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/30 text-slate-400 hover:text-red-400 transition-all flex-shrink-0"
                data-testid="parking-lot-delete-button"
              >
                <MuiIcons.Close style={{ fontSize: 10 }} />
              </button>
            </div>
          ))
        )}
        {items.length > 10 && (
          <p className="text-[10px] text-slate-500 text-center">
            +{items.length - 10} more items
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Priorities Content
 */
function PrioritiesContent() {
  return (
    <div className="pt-2">
      <PrioritiesList />
    </div>
  );
}

/**
 * Quick Entry Content
 */
function QuickEntryContent() {
  const { openModal } = useUIStore();

  return (
    <div className="pt-2 space-y-2">
      <div className="flex gap-1.5">
        <button
          onClick={() => openModal('habit-form')}
          className="flex-1 py-2 px-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <MuiIcons.CheckCircle style={{ fontSize: 14 }} />
          Habit
        </button>
        <button
          onClick={() => openModal('task-form')}
          className="flex-1 py-2 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <MuiIcons.Assignment style={{ fontSize: 14 }} />
          Task
        </button>
      </div>
    </div>
  );
}

/**
 * Task Backlog Content - Shows unassigned tasks
 */
function TaskBacklogContent() {
  const { data: tasksData, isLoading } = useTasks();

  const backlogTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    return tasksData.data
      .filter(
        (task: Task) =>
          !task.plannedDate && !task.isDeleted && task.status !== 'complete'
      )
      .sort((a: Task, b: Task) => {
        const aPriority = a.priority ?? 999;
        const bPriority = b.priority ?? 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 10);
  }, [tasksData?.data]);

  if (isLoading) {
    return (
      <div className="py-2 text-center text-slate-400 text-xs">Loading...</div>
    );
  }

  return (
    <div className="pt-2 space-y-1.5" data-testid="task-backlog-content">
      {backlogTasks.length === 0 ? (
        <div className="py-2 text-center text-slate-500 text-xs">
          <p>No unassigned tasks</p>
        </div>
      ) : (
        backlogTasks.map((task: Task) => (
          <BacklogTaskCard key={task.id} task={task} />
        ))
      )}
    </div>
  );
}

/**
 * Draggable task card for backlog
 */
function BacklogTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const getPriorityStyle = (priority?: number) => {
    if (priority === 1)
      return { border: 'border-l-red-500', text: 'text-red-400', label: 'H' };
    if (priority === 2)
      return {
        border: 'border-l-yellow-500',
        text: 'text-yellow-400',
        label: 'M',
      };
    return { border: 'border-l-blue-500', text: 'text-blue-400', label: 'L' };
  };

  const priorityStyle = getPriorityStyle(task.priority);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-2 rounded-lg border-l-2 cursor-grab active:cursor-grabbing
        ${priorityStyle.border}
        ${isDragging ? 'opacity-50 shadow-lg' : 'bg-slate-700/30 hover:bg-slate-700/50'}
        transition-colors
      `}
      data-testid="backlog-task-card"
    >
      <div className="flex items-start gap-1.5">
        <MuiIcons.DragIndicator
          style={{ fontSize: 12 }}
          className="text-slate-500 mt-0.5 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-200 truncate">{task.title}</p>
        </div>
        <span
          className={`text-[9px] px-1 py-0.5 rounded uppercase font-medium ${priorityStyle.text} bg-slate-700/50`}
        >
          {priorityStyle.label}
        </span>
      </div>
    </div>
  );
}

export default RightSidebar;
