import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useUIStore, useDashboardStore } from '../../stores';
import { useTasks } from '../../api';
import * as MuiIcons from '@mui/icons-material';
import { PrioritiesList } from './PrioritiesList';
import { ComponentPicker } from './ComponentPicker';
import type { Task } from '../../types';

// Parking Lot types and localStorage key
interface ParkingLotItem {
  id: string;
  text: string;
  createdAt: number;
}

const PARKING_LOT_STORAGE_KEY = 'habitarcade-parking-lot';
const RIGHT_PANEL_MODULES_KEY = 'habitarcade-right-panel-modules';

// Available module types for the right panel
type ModuleType = 'parking-lot' | 'priorities' | 'quick-entry' | 'task-backlog' | 'todays-todos';

interface PanelModule {
  id: string;
  type: ModuleType;
  collapsed: boolean;
}

// Default modules for the right panel
const DEFAULT_MODULES: PanelModule[] = [
  { id: 'todays-todos-1', type: 'todays-todos', collapsed: false },
  { id: 'parking-lot-1', type: 'parking-lot', collapsed: false },
];

// Module definitions for configuration
const AVAILABLE_MODULES: { type: ModuleType; label: string; icon: keyof typeof MuiIcons; description: string }[] = [
  { type: 'todays-todos', label: "Today's Todos", icon: 'Today', description: 'Tasks scheduled for today' },
  { type: 'parking-lot', label: 'Parking Lot', icon: 'LocalParking', description: 'Quick ideas to process later' },
  { type: 'task-backlog', label: 'Task Backlog', icon: 'Inbox', description: 'Unassigned tasks' },
  { type: 'priorities', label: 'Priorities', icon: 'PriorityHigh', description: 'Priority management' },
  { type: 'quick-entry', label: 'Quick Entry', icon: 'FlashOn', description: 'Quickly add items' },
];

interface RightDrawerProps {
  isOpen: boolean;
  width?: number;
}

type DrawerTab = 'modules' | 'parking-lot' | 'priorities' | 'quick-entry' | 'properties' | 'task-backlog' | 'components';

const DRAWER_TABS: { id: DrawerTab; label: string; icon: keyof typeof MuiIcons; editModeOnly?: boolean }[] = [
  { id: 'components', label: 'Components', icon: 'Widgets', editModeOnly: true },
  { id: 'modules', label: 'Modules', icon: 'ViewModule' },
  { id: 'parking-lot', label: 'Parking Lot', icon: 'LocalParking' },
  { id: 'task-backlog', label: 'Task Backlog', icon: 'Inbox' },
  { id: 'priorities', label: 'Priorities', icon: 'PriorityHigh' },
  { id: 'quick-entry', label: 'Quick Entry', icon: 'FlashOn' },
  { id: 'properties', label: 'Properties', icon: 'Settings' },
];

export function RightDrawer({ isOpen, width = 320 }: RightDrawerProps) {
  const { rightDrawerContent, setRightDrawerContent, closeRightDrawer } = useUIStore();
  const { isEditMode } = useDashboardStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Module configuration state
  const [modules, setModules] = useState<PanelModule[]>(() => {
    try {
      const stored = localStorage.getItem(RIGHT_PANEL_MODULES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error('Failed to load right panel modules:', error);
    }
    return DEFAULT_MODULES;
  });

  // Save modules to localStorage
  const saveModules = useCallback((newModules: PanelModule[]) => {
    setModules(newModules);
    try {
      localStorage.setItem(RIGHT_PANEL_MODULES_KEY, JSON.stringify(newModules));
    } catch (error) {
      console.error('Failed to save right panel modules:', error);
    }
  }, []);

  // Toggle module collapsed state
  const toggleModuleCollapsed = useCallback((moduleId: string) => {
    saveModules(modules.map(m =>
      m.id === moduleId ? { ...m, collapsed: !m.collapsed } : m
    ));
  }, [modules, saveModules]);

  // Add a new module
  const addModule = useCallback((type: ModuleType) => {
    const newModule: PanelModule = {
      id: `${type}-${Date.now()}`,
      type,
      collapsed: false,
    };
    saveModules([...modules, newModule]);
  }, [modules, saveModules]);

  // Remove a module
  const removeModule = useCallback((moduleId: string) => {
    saveModules(modules.filter(m => m.id !== moduleId));
  }, [modules, saveModules]);

  // Filter tabs based on edit mode
  const visibleTabs = useMemo(() => {
    return DRAWER_TABS.filter(tab => !tab.editModeOnly || isEditMode);
  }, [isEditMode]);

  // No click-outside-to-close for fixed panel (user explicitly closes with button)
  // Escape key still works for accessibility
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
        return <ComponentPicker />;
      case 'modules':
        return (
          <ModulesConfigContent
            modules={modules}
            onAddModule={addModule}
            onRemoveModule={removeModule}
            onToggleCollapsed={toggleModuleCollapsed}
          />
        );
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
        // Default view: show the configured modules
        return (
          <ModulesView
            modules={modules}
            onToggleCollapsed={toggleModuleCollapsed}
            onRemoveModule={removeModule}
          />
        );
    }
  };

  const getContentTitle = () => {
    const tab = DRAWER_TABS.find(t => t.id === rightDrawerContent);
    if (tab) return tab.label;
    // Default view shows "Panel" as title
    return 'Panel';
  };

  return (
    // Fixed panel - no overlay, just slides in/out
    <aside
      ref={drawerRef}
      data-testid="right-drawer"
      className={`
        fixed right-0 top-16 h-[calc(100vh-4rem)]
        bg-slate-800/95 backdrop-blur-md border-l border-slate-700/50
        transition-all duration-300 ease-in-out z-40
        flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{ width: `${width}px` }}
      role="complementary"
      aria-label="Right sidebar panel"
      aria-hidden={!isOpen}
    >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">{getContentTitle()}</h2>
          <button
            onClick={closeRightDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors group"
            aria-label="Collapse drawer"
            data-testid="drawer-close-button"
            title="Collapse panel"
          >
            <MuiIcons.KeyboardDoubleArrowRight
              style={{ fontSize: 20 }}
              className="group-hover:translate-x-0.5 transition-transform"
            />
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
                  ${tab.editModeOnly ? 'ring-1 ring-teal-500/30' : ''}
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

function ParkingLotContent({ compact = false }: { compact?: boolean }) {
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

  // For compact mode, show limited items
  const displayItems = compact ? items.slice(0, 3) : items;

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'}`} data-testid="parking-lot-content">
      {!compact && (
        <p className="text-sm text-slate-400">
          Capture quick ideas to process later. Press Enter to add.
        </p>
      )}

      {/* Quick input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick idea..."
          className={`flex-1 px-3 ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500`}
          data-testid="parking-lot-input"
          aria-label="Add idea to parking lot"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className={`px-2 ${compact ? 'py-1.5' : 'py-2.5'} bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
          data-testid="parking-lot-add-button"
          aria-label="Add item"
        >
          <MuiIcons.Add style={{ fontSize: compact ? 14 : 18 }} />
        </button>
      </div>

      {/* Items list */}
      <div className={`${compact ? 'space-y-1' : 'space-y-2'}`} data-testid="parking-lot-list">
        {items.length === 0 ? (
          <div className={`${compact ? 'py-2' : 'p-4'} text-center text-slate-500 text-sm`}>
            <MuiIcons.LocalParking style={{ fontSize: compact ? 24 : 32 }} className="mb-1 opacity-50" />
            <p className={compact ? 'text-xs' : ''}>No parked ideas yet</p>
          </div>
        ) : (
          displayItems.map((item) => (
            <div
              key={item.id}
              className={`${compact ? 'p-2' : 'p-3'} bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-teal-500/50 transition-colors group`}
              data-testid="parking-lot-item"
            >
              <div className="flex items-start gap-2">
                <MuiIcons.LightbulbOutlined style={{ fontSize: compact ? 14 : 16 }} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className={`flex-1 ${compact ? 'text-xs' : 'text-sm'} text-slate-300 ${compact ? 'truncate' : 'break-words'}`} data-testid="parking-lot-item-text">
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded bg-slate-600/50 hover:bg-red-500/50 text-slate-400 hover:text-white transition-all flex-shrink-0"
                  data-testid="parking-lot-delete-button"
                  aria-label={`Delete: ${item.text}`}
                >
                  <MuiIcons.Close style={{ fontSize: 12 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item count / show more */}
      {items.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          {compact && items.length > 3 ? (
            <span>+{items.length - 3} more ideas</span>
          ) : (
            <span>{items.length} {items.length === 1 ? 'idea' : 'ideas'} parked</span>
          )}
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
 * TaskBacklogContent - Shows unassigned tasks that can be dragged to day columns
 */
function TaskBacklogContent({ compact = false }: { compact?: boolean }) {
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

  const displayTasks = compact ? backlogTasks.slice(0, 4) : backlogTasks;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-4' : 'py-8'}`}>
        <div className="text-slate-400 text-sm">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'}`} data-testid="task-backlog-content">
      {!compact && (
        <p className="text-sm text-slate-400">
          Unassigned tasks. Drag to a day column to schedule.
        </p>
      )}

      {/* Task list */}
      <div className={`${compact ? 'space-y-1' : 'space-y-2'}`} data-testid="backlog-task-list">
        {backlogTasks.length === 0 ? (
          <div className={`${compact ? 'py-2' : 'p-4'} text-center text-slate-500 text-sm`}>
            <MuiIcons.Inbox style={{ fontSize: compact ? 24 : 32 }} className="mb-1 opacity-50" />
            <p className={compact ? 'text-xs' : ''}>No unassigned tasks</p>
          </div>
        ) : (
          displayTasks.map((task: Task) => (
            <BacklogTaskCard key={task.id} task={task} compact={compact} />
          ))
        )}
      </div>

      {/* Task count */}
      {backlogTasks.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          {compact && backlogTasks.length > 4 ? (
            <span>+{backlogTasks.length - 4} more tasks</span>
          ) : (
            <span>{backlogTasks.length} {backlogTasks.length === 1 ? 'task' : 'tasks'} in backlog</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Draggable task card for backlog
 */
function BacklogTaskCard({ task, compact = false }: { task: Task; compact?: boolean }) {
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
        ${compact ? 'p-2' : 'p-3'} rounded-lg border-l-4 cursor-grab active:cursor-grabbing
        ${priorityStyle.border}
        ${isDragging ? 'opacity-50 shadow-lg' : 'hover:bg-slate-700/50'}
        transition-colors
      `}
      data-testid="backlog-task-card"
    >
      <div className="flex items-start gap-2">
        {!compact && (
          <MuiIcons.DragIndicator
            style={{ fontSize: 16 }}
            className="text-slate-500 mt-0.5 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-200 truncate`}>{task.title}</p>
          {!compact && task.project && (
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

/**
 * ModulesView - Displays configured modules in the default panel view
 */
interface ModulesViewProps {
  modules: PanelModule[];
  onToggleCollapsed: (moduleId: string) => void;
  onRemoveModule: (moduleId: string) => void;
}

function ModulesView({ modules, onToggleCollapsed, onRemoveModule }: ModulesViewProps) {
  const renderModule = (module: PanelModule) => {
    const moduleInfo = AVAILABLE_MODULES.find(m => m.type === module.type);
    if (!moduleInfo) return null;

    const IconComponent = MuiIcons[moduleInfo.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

    return (
      <div key={module.id} className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden">
        {/* Module header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-700/50 border-b border-slate-600/30">
          <div className="flex items-center gap-2">
            <IconComponent style={{ fontSize: 16 }} className="text-teal-400" />
            <span className="text-sm font-medium text-slate-200">{moduleInfo.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleCollapsed(module.id)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title={module.collapsed ? 'Expand' : 'Collapse'}
            >
              {module.collapsed ? (
                <MuiIcons.ExpandMore style={{ fontSize: 16 }} />
              ) : (
                <MuiIcons.ExpandLess style={{ fontSize: 16 }} />
              )}
            </button>
            <button
              onClick={() => onRemoveModule(module.id)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
              title="Remove module"
            >
              <MuiIcons.Close style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        {/* Module content */}
        {!module.collapsed && (
          <div className="p-3">
            <ModuleContent type={module.type} compact />
          </div>
        )}
      </div>
    );
  };

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <MuiIcons.ViewModule style={{ fontSize: 48 }} className="mb-3 opacity-50" />
        <p className="text-sm font-medium">No modules configured</p>
        <p className="text-xs mt-1">Go to Modules tab to add widgets</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="modules-view">
      {modules.map(renderModule)}
    </div>
  );
}

/**
 * ModuleContent - Renders the content for a specific module type
 */
function ModuleContent({ type, compact = false }: { type: ModuleType; compact?: boolean }) {
  switch (type) {
    case 'todays-todos':
      return <TodaysTodosContent compact={compact} />;
    case 'parking-lot':
      return <ParkingLotContent compact={compact} />;
    case 'task-backlog':
      return <TaskBacklogContent compact={compact} />;
    case 'priorities':
      return <PrioritiesContent />;
    case 'quick-entry':
      return <QuickEntryContent />;
    default:
      return <div className="text-slate-400 text-sm">Unknown module</div>;
  }
}

/**
 * ModulesConfigContent - Configuration panel for adding/removing modules
 */
interface ModulesConfigContentProps {
  modules: PanelModule[];
  onAddModule: (type: ModuleType) => void;
  onRemoveModule: (moduleId: string) => void;
  onToggleCollapsed: (moduleId: string) => void;
}

function ModulesConfigContent({ modules, onAddModule, onRemoveModule }: ModulesConfigContentProps) {
  return (
    <div className="space-y-4" data-testid="modules-config-content">
      <p className="text-sm text-slate-400">
        Configure which modules appear in your right panel. Add or remove widgets that stay visible as you navigate.
      </p>

      {/* Current modules */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Modules</h3>
        {modules.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">No modules added yet</p>
        ) : (
          <div className="space-y-2">
            {modules.map((module) => {
              const moduleInfo = AVAILABLE_MODULES.find(m => m.type === module.type);
              if (!moduleInfo) return null;
              const IconComponent = MuiIcons[moduleInfo.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

              return (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg border border-slate-600/50"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent style={{ fontSize: 16 }} className="text-teal-400" />
                    <span className="text-sm text-slate-200">{moduleInfo.label}</span>
                  </div>
                  <button
                    onClick={() => onRemoveModule(module.id)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
                    title="Remove module"
                  >
                    <MuiIcons.Close style={{ fontSize: 14 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available modules to add */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Module</h3>
        <div className="space-y-2">
          {AVAILABLE_MODULES.map((moduleInfo) => {
            const IconComponent = MuiIcons[moduleInfo.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

            return (
              <button
                key={moduleInfo.type}
                onClick={() => onAddModule(moduleInfo.type)}
                className="w-full flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-teal-500/30 transition-colors text-left group"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-600/50 group-hover:bg-teal-500/20 transition-colors">
                  <IconComponent style={{ fontSize: 18 }} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{moduleInfo.label}</p>
                  <p className="text-xs text-slate-500">{moduleInfo.description}</p>
                </div>
                <MuiIcons.Add style={{ fontSize: 18 }} className="ml-auto text-slate-500 group-hover:text-teal-400 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * TodaysTodosContent - Shows today's tasks
 */
function TodaysTodosContent({ compact = false }: { compact?: boolean }) {
  const { data: tasksData, isLoading } = useTasks();

  // Filter to today's tasks only
  const todaysTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return tasksData.data.filter((task: Task) => {
      if (task.isDeleted) return false;
      if (!task.plannedDate) return false;
      const taskDate = new Date(task.plannedDate).toISOString().split('T')[0];
      return taskDate === todayStr;
    }).sort((a: Task, b: Task) => {
      // Sort completed to bottom, then by priority
      if (a.status === 'complete' && b.status !== 'complete') return 1;
      if (a.status !== 'complete' && b.status === 'complete') return -1;
      const aPriority = a.priority ?? 999;
      const bPriority = b.priority ?? 999;
      return aPriority - bPriority;
    });
  }, [tasksData?.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (todaysTasks.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-2' : 'py-4'}`}>
        <MuiIcons.CheckCircleOutline style={{ fontSize: compact ? 24 : 32 }} className="text-slate-500 mb-1" />
        <p className="text-sm text-slate-500">No tasks for today</p>
      </div>
    );
  }

  const completedCount = todaysTasks.filter((t: Task) => t.status === 'complete').length;
  const totalCount = todaysTasks.length;

  return (
    <div className="space-y-2" data-testid="todays-todos-content">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
        <span>{completedCount}/{totalCount}</span>
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {todaysTasks.slice(0, compact ? 5 : undefined).map((task: Task) => (
          <div
            key={task.id}
            className={`
              flex items-center gap-2 p-2 rounded-lg
              ${task.status === 'complete' ? 'opacity-50' : 'hover:bg-slate-700/30'}
              transition-colors
            `}
          >
            {task.status === 'complete' ? (
              <MuiIcons.CheckCircle style={{ fontSize: 16 }} className="text-teal-400 flex-shrink-0" />
            ) : (
              <MuiIcons.RadioButtonUnchecked style={{ fontSize: 16 }} className="text-slate-500 flex-shrink-0" />
            )}
            <span className={`text-sm truncate flex-1 ${task.status === 'complete' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {task.title}
            </span>
          </div>
        ))}
        {compact && todaysTasks.length > 5 && (
          <p className="text-xs text-slate-500 text-center pt-1">
            +{todaysTasks.length - 5} more
          </p>
        )}
      </div>
    </div>
  );
}

export default RightDrawer;
