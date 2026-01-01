import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useUIStore, useDashboardStore } from '../../stores';
import { useTasks } from '../../api';
import * as MuiIcons from '@mui/icons-material';
import { PrioritiesList } from './PrioritiesList';
import { WIDGET_META, getAvailableWidgets } from '../Dashboard/WidgetRegistry';
import type { Task } from '../../types';

// Parking Lot types and localStorage key
interface ParkingLotItem {
  id: string;
  text: string;
  createdAt: number;
}

const PARKING_LOT_STORAGE_KEY = 'habitarcade-parking-lot';

interface RightDrawerProps {
  isOpen: boolean;
  width?: number;
  overlay?: boolean;
}

type DrawerTab = 'parking-lot' | 'priorities' | 'quick-entry' | 'properties' | 'task-backlog' | 'components';

const DRAWER_TABS: { id: DrawerTab; label: string; icon: keyof typeof MuiIcons; editModeOnly?: boolean }[] = [
  { id: 'components', label: 'Components', icon: 'Widgets', editModeOnly: true },
  { id: 'parking-lot', label: 'Parking Lot', icon: 'LocalParking' },
  { id: 'task-backlog', label: 'Task Backlog', icon: 'Inbox' },
  { id: 'priorities', label: 'Priorities', icon: 'PriorityHigh' },
  { id: 'quick-entry', label: 'Quick Entry', icon: 'FlashOn' },
  { id: 'properties', label: 'Properties', icon: 'Settings' },
];

export function RightDrawer({ isOpen, width = 320, overlay = true }: RightDrawerProps) {
  const { rightDrawerContent, setRightDrawerContent, closeRightDrawer } = useUIStore();
  const { isEditMode } = useDashboardStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Filter tabs based on edit mode - only show components tab when in edit mode
  const visibleTabs = useMemo(() => {
    return DRAWER_TABS.filter(tab => !tab.editModeOnly || isEditMode);
  }, [isEditMode]);

  // Handle click outside to close (only if overlay mode)
  useEffect(() => {
    if (!isOpen || !overlay) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        // Check if click is on the toggle button (don't close if so)
        const target = event.target as HTMLElement;
        if (target.closest('[data-drawer-toggle]')) return;
        closeRightDrawer();
      }
    };

    // Add delay to prevent immediate close when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, overlay, closeRightDrawer]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRightDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeRightDrawer]);

  const renderContent = () => {
    switch (rightDrawerContent) {
      case 'components':
        return <ComponentsContent />;
      case 'parking-lot':
        return <ParkingLotContent />;
      case 'task-backlog':
        return <TaskBacklogContent />;
      case 'priorities':
        return <PrioritiesContent />;
      case 'quick-entry':
        return <QuickEntryContent />;
      case 'properties':
        return <PropertiesContent />;
      default:
        return <ParkingLotContent />;
    }
  };

  const getContentTitle = () => {
    const tab = DRAWER_TABS.find(t => t.id === rightDrawerContent);
    return tab?.label || 'Drawer';
  };

  return (
    <>
      {/* Overlay backdrop */}
      {overlay && (
        <div
          className={`
            fixed inset-0 bg-black/40 backdrop-blur-sm z-40
            transition-opacity duration-300 ease-in-out
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        data-testid="right-drawer"
        className={`
          fixed right-0 top-16 h-[calc(100vh-4rem)]
          bg-slate-800/95 backdrop-blur-md border-l border-slate-700/50
          transition-transform duration-300 ease-in-out z-50
          flex flex-col shadow-2xl shadow-black/50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: `${width}px` }}
        role="complementary"
        aria-label="Right sidebar drawer"
        aria-hidden={!isOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">{getContentTitle()}</h2>
          <button
            onClick={closeRightDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            aria-label="Close drawer"
            data-testid="drawer-close-button"
          >
            <MuiIcons.Close style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-700/50 px-2 py-2 gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const IconComponent = MuiIcons[tab.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
            const isActive = rightDrawerContent === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setRightDrawerContent(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150 whitespace-nowrap
                  ${isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }
                `}
                data-testid={`drawer-tab-${tab.id}`}
                aria-selected={isActive}
              >
                <IconComponent style={{ fontSize: 14 }} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto p-4" data-testid="drawer-content">
          {renderContent()}
        </div>
      </aside>
    </>
  );
}

// Content panels

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

    // Add to beginning (newest first)
    saveItems([newItem, ...items]);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, items, saveItems]);

  // Delete an item
  const deleteItem = useCallback((id: string) => {
    saveItems(items.filter(item => item.id !== id));
  }, [items, saveItems]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-4" data-testid="parking-lot-content">
      <p className="text-sm text-slate-400">
        Capture quick ideas to process later. Press Enter to add.
      </p>

      {/* Quick input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick idea..."
          className="flex-1 px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          data-testid="parking-lot-input"
          aria-label="Add idea to parking lot"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="px-3 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          data-testid="parking-lot-add-button"
          aria-label="Add item"
        >
          <MuiIcons.Add style={{ fontSize: 18 }} />
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-2" data-testid="parking-lot-list">
        {items.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            <MuiIcons.LocalParking style={{ fontSize: 32 }} className="mb-2 opacity-50" />
            <p>No parked ideas yet</p>
            <p className="text-xs mt-1">Add your first idea above</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-teal-500/50 transition-colors group"
              data-testid="parking-lot-item"
            >
              <div className="flex items-start gap-2">
                <MuiIcons.LightbulbOutlined style={{ fontSize: 16 }} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="flex-1 text-sm text-slate-300 break-words" data-testid="parking-lot-item-text">
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-slate-600/50 hover:bg-red-500/50 text-slate-400 hover:text-white transition-all flex-shrink-0"
                  data-testid="parking-lot-delete-button"
                  aria-label={`Delete: ${item.text}`}
                >
                  <MuiIcons.Close style={{ fontSize: 14 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item count */}
      {items.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          {items.length} {items.length === 1 ? 'idea' : 'ideas'} parked
        </div>
      )}
    </div>
  );
}

function PrioritiesContent() {
  return <PrioritiesList />;
}

function QuickEntryContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Quickly add habits, tasks, or notes without leaving your current view.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Quick add
          </label>
          <input
            type="text"
            placeholder="Type and press Enter..."
            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          />
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition-colors">
            <MuiIcons.CheckCircle style={{ fontSize: 14 }} className="inline mr-1" />
            Habit
          </button>
          <button className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors">
            <MuiIcons.Assignment style={{ fontSize: 14 }} className="inline mr-1" />
            Task
          </button>
          <button className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors">
            <MuiIcons.Note style={{ fontSize: 14 }} className="inline mr-1" />
            Note
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertiesContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        View and edit properties of the selected item.
      </p>

      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 text-center">
        <MuiIcons.TouchApp style={{ fontSize: 32 }} className="text-slate-500 mb-2" />
        <p className="text-sm text-slate-500">
          Select an item to view its properties
        </p>
      </div>
    </div>
  );
}

/**
 * ComponentsContent - Shows available dashboard widgets that can be added
 * Only visible when in edit mode
 */
function ComponentsContent() {
  const { layout, setLayout } = useDashboardStore();
  const availableWidgets = getAvailableWidgets();

  // Get widgets that are already on the dashboard
  const activeWidgetIds = useMemo(() => {
    return new Set(layout.map(item => item.i));
  }, [layout]);

  // Separate available and active widgets
  const { inactiveWidgets, activeWidgets } = useMemo(() => {
    const inactive: string[] = [];
    const active: string[] = [];

    availableWidgets.forEach(widgetId => {
      if (activeWidgetIds.has(widgetId)) {
        active.push(widgetId);
      } else {
        inactive.push(widgetId);
      }
    });

    return { inactiveWidgets: inactive, activeWidgets: active };
  }, [availableWidgets, activeWidgetIds]);

  // Add widget to dashboard
  const handleAddWidget = useCallback((widgetId: string) => {
    const meta = WIDGET_META[widgetId];
    if (!meta) return;

    // Find the lowest y position in the current layout to place new widget at bottom
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

    const newWidget = {
      i: widgetId,
      x: 0,
      y: maxY,
      w: meta.defaultSize.w,
      h: meta.defaultSize.h,
      minW: meta.minSize.w,
      minH: meta.minSize.h,
      maxW: meta.maxSize?.w,
      maxH: meta.maxSize?.h,
    };

    setLayout([...layout, newWidget]);
  }, [layout, setLayout]);

  // Remove widget from dashboard
  const handleRemoveWidget = useCallback((widgetId: string) => {
    setLayout(layout.filter(item => item.i !== widgetId));
  }, [layout, setLayout]);

  return (
    <div className="space-y-4" data-testid="components-content">
      <p className="text-sm text-slate-400">
        Add or remove dashboard widgets. Drag widgets on the dashboard to rearrange.
      </p>

      {/* Available widgets to add */}
      {inactiveWidgets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Available Widgets
          </h3>
          <div className="space-y-2" data-testid="available-widgets-list">
            {inactiveWidgets.map((widgetId) => {
              const meta = WIDGET_META[widgetId];
              if (!meta) return null;

              return (
                <WidgetCard
                  key={widgetId}
                  meta={meta}
                  isActive={false}
                  onAdd={() => handleAddWidget(widgetId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Active widgets on dashboard */}
      {activeWidgets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Active Widgets
          </h3>
          <div className="space-y-2" data-testid="active-widgets-list">
            {activeWidgets.map((widgetId) => {
              const meta = WIDGET_META[widgetId];
              if (!meta) return null;

              return (
                <WidgetCard
                  key={widgetId}
                  meta={meta}
                  isActive={true}
                  onRemove={() => handleRemoveWidget(widgetId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Widget count */}
      <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700/50">
        {activeWidgets.length} of {availableWidgets.length} widgets active
      </div>
    </div>
  );
}

/**
 * Widget card component for displaying widget info
 */
interface WidgetCardProps {
  meta: typeof WIDGET_META[string];
  isActive: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
}

function WidgetCard({ meta, isActive, onAdd, onRemove }: WidgetCardProps) {
  return (
    <div
      className={`
        p-3 rounded-lg border transition-all
        ${isActive
          ? 'bg-teal-900/20 border-teal-600/50'
          : 'bg-slate-700/30 border-slate-600/50 hover:border-teal-500/50'
        }
      `}
      data-testid={`widget-card-${meta.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Widget icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${isActive ? 'bg-teal-600/30 text-teal-400' : 'bg-slate-600/50 text-slate-400'}
        `}>
          {meta.icon}
        </div>

        {/* Widget info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">{meta.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{meta.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-500">
              {meta.defaultSize.w}x{meta.defaultSize.h}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex-shrink-0">
          {isActive ? (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
              title="Remove from dashboard"
              data-testid={`remove-widget-${meta.id}`}
            >
              <MuiIcons.Remove style={{ fontSize: 16 }} />
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 hover:text-teal-300 transition-colors"
              title="Add to dashboard"
              data-testid={`add-widget-${meta.id}`}
            >
              <MuiIcons.Add style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TaskBacklogContent - Shows unassigned tasks that can be dragged to day columns
 */
function TaskBacklogContent() {
  const { data: tasksData, isLoading } = useTasks();

  // Filter to only unassigned, non-deleted, incomplete tasks
  const backlogTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    return tasksData.data.filter(
      (task: Task) => !task.plannedDate && !task.isDeleted && task.status !== 'complete'
    ).sort((a: Task, b: Task) => {
      // Sort by priority (lower number = higher priority), then by creation date
      const aPriority = a.priority ?? 999;
      const bPriority = b.priority ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasksData?.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="task-backlog-content">
      <p className="text-sm text-slate-400">
        Unassigned tasks. Drag to a day column to schedule.
      </p>

      {/* Task list */}
      <div className="space-y-2" data-testid="backlog-task-list">
        {backlogTasks.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            <MuiIcons.Inbox style={{ fontSize: 32 }} className="mb-2 opacity-50" />
            <p>No unassigned tasks</p>
            <p className="text-xs mt-1">All tasks are scheduled!</p>
          </div>
        ) : (
          backlogTasks.map((task: Task) => (
            <BacklogTaskCard key={task.id} task={task} />
          ))
        )}
      </div>

      {/* Task count */}
      {backlogTasks.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          {backlogTasks.length} {backlogTasks.length === 1 ? 'task' : 'tasks'} in backlog
        </div>
      )}
    </div>
  );
}

/**
 * Draggable task card for backlog
 */
function BacklogTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  // Priority: 1=high (red), 2=medium (yellow), 3+=low (blue)
  const getPriorityStyle = (priority?: number) => {
    if (priority === 1) return { border: 'border-l-red-500 bg-red-500/5', text: 'text-red-400 bg-red-500/20', label: 'H' };
    if (priority === 2) return { border: 'border-l-yellow-500 bg-yellow-500/5', text: 'text-yellow-400 bg-yellow-500/20', label: 'M' };
    return { border: 'border-l-blue-500 bg-blue-500/5', text: 'text-blue-400 bg-blue-500/20', label: 'L' };
  };

  const priorityStyle = getPriorityStyle(task.priority);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-lg border-l-4 cursor-grab active:cursor-grabbing
        ${priorityStyle.border}
        ${isDragging ? 'opacity-50 shadow-lg' : 'hover:bg-slate-700/50'}
        transition-colors
      `}
      data-testid="backlog-task-card"
    >
      <div className="flex items-start gap-2">
        <MuiIcons.DragIndicator
          style={{ fontSize: 16 }}
          className="text-slate-500 mt-0.5 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 truncate">{task.title}</p>
          {task.project && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {task.project.name}
            </p>
          )}
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${priorityStyle.text}`}>
          {priorityStyle.label}
        </span>
      </div>
    </div>
  );
}

export default RightDrawer;
