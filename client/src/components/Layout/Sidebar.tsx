import { useState } from 'react';
import { useUIStore } from '../../stores';
import type { PageType } from '../../stores';
import * as MuiIcons from '@mui/icons-material';

interface NavItem {
  id: PageType;
  icon: keyof typeof MuiIcons;
  label: string;
  action?: () => void;
  children?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { openModal, currentPage, setCurrentPage } = useUIStore();
  const [expandedItems, setExpandedItems] = useState<Set<PageType>>(new Set(['tasks']));

  const NAV_ITEMS: NavItem[] = [
    { id: 'today', icon: 'Today', label: 'Today' },
    { id: 'dashboard', icon: 'Dashboard', label: 'Dashboard' },
    { id: 'habits', icon: 'CheckCircle', label: 'Habits' },
    {
      id: 'tasks',
      icon: 'Assignment',
      label: 'Tasks',
      children: [
        { id: 'kanban-day', icon: 'ViewWeek', label: 'Day View' },
        { id: 'kanban-status', icon: 'ViewKanban', label: 'Status View' },
        { id: 'kanban-project', icon: 'Folder', label: 'Project View' },
        { id: 'kanban-category', icon: 'Category', label: 'Category View' },
      ]
    },
    { id: 'targets', icon: 'TrackChanges', label: 'Targets' },
    { id: 'time-blocks', icon: 'Schedule', label: 'Time Blocks' },
    { id: 'projects', icon: 'Folder', label: 'Projects' },
    { id: 'analytics', icon: 'BarChart', label: 'Analytics' },
    {
      id: 'manage',
      icon: 'Tune',
      label: 'Manage',
      children: [
        { id: 'manage-habits', icon: 'CheckCircle', label: 'Habits' },
        { id: 'manage-categories', icon: 'Category', label: 'Categories' },
        { id: 'manage-projects', icon: 'Folder', label: 'Projects' },
        { id: 'manage-tags', icon: 'LocalOffer', label: 'Tags' },
        { id: 'manage-priorities', icon: 'LowPriority', label: 'Priorities' },
        { id: 'settings', icon: 'Settings', label: 'Settings' },
      ]
    },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.children) {
      // Toggle expansion for items with children
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      setCurrentPage(item.id);
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.id === currentPage) return true;
    if (item.children) {
      return item.children.some(child => child.id === currentPage);
    }
    return false;
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const IconComponent = MuiIcons[item.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = isItemActive(item);

    return (
      <div key={item.id}>
        <button
          onClick={() => handleNavClick(item)}
          title={!isOpen ? item.label : undefined}
          data-testid={`nav-${item.id}`}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-slate-300 hover:bg-slate-700/50 hover:text-white
            transition-all duration-150
            group
            ${isChild ? 'pl-8' : ''}
            ${isActive ? 'bg-slate-700/30 text-white' : ''}
          `}
        >
          <div className={`
            flex items-center justify-center
            ${isOpen ? 'w-6' : 'w-full'}
          `}>
            <IconComponent
              style={{ fontSize: isChild ? 18 : 22 }}
              className="text-current group-hover:scale-110 transition-transform"
            />
          </div>
          {isOpen && (
            <>
              <span className={`font-medium ${isChild ? 'text-xs' : 'text-sm'} whitespace-nowrap flex-1`}>
                {item.label}
              </span>
              {hasChildren && (
                <MuiIcons.ExpandMore
                  style={{ fontSize: 18 }}
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              )}
            </>
          )}
        </button>

        {/* Render children when expanded */}
        {hasChildren && isExpanded && isOpen && (
          <div className="mt-1 space-y-1" data-testid={`nav-${item.id}-children`}>
            {item.children!.map(child => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)]
        bg-slate-800/90 backdrop-blur-md border-r border-slate-700/50
        transition-all duration-300 ease-in-out z-40
        flex flex-col
        ${isOpen ? 'w-64' : 'w-16'}
      `}
    >
      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => renderNavItem(item))}
      </nav>

      {/* Quick actions section */}
      <div className={`
        p-3 border-t border-slate-700/50
        ${isOpen ? 'space-y-2' : 'flex flex-col items-center gap-2'}
      `}>
        {/* Add Habit Button */}
        <button
          onClick={() => openModal('habit-form')}
          title={!isOpen ? 'Add Habit' : undefined}
          className={`
            flex items-center justify-center gap-2
            bg-gradient-to-r from-teal-600 to-teal-500
            hover:from-teal-500 hover:to-teal-400
            text-white rounded-xl transition-all duration-150
            shadow-lg shadow-teal-600/20 hover:shadow-teal-500/30
            ${isOpen ? 'w-full py-2.5 px-4' : 'w-10 h-10'}
          `}
        >
          <MuiIcons.Add style={{ fontSize: isOpen ? 20 : 24 }} />
          {isOpen && <span className="font-medium text-sm">Add Habit</span>}
        </button>

        {/* Add Task Button */}
        <button
          onClick={() => openModal('task-form')}
          title={!isOpen ? 'Add Task' : undefined}
          className={`
            flex items-center justify-center gap-2
            bg-slate-700 hover:bg-slate-600
            text-white rounded-xl transition-all duration-150
            ${isOpen ? 'w-full py-2.5 px-4' : 'w-10 h-10'}
          `}
        >
          <MuiIcons.AddTask style={{ fontSize: isOpen ? 20 : 24 }} />
          {isOpen && <span className="font-medium text-sm">Add Task</span>}
        </button>

        {/* Collapsed state: More options */}
        {!isOpen && (
          <button
            onClick={() => openModal('category-form')}
            title="Add Category"
            className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            <MuiIcons.Category style={{ fontSize: 20 }} />
          </button>
        )}

        {/* Expanded state: Additional quick actions */}
        {isOpen && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => openModal('category-form')}
              title="Add Category"
              className="flex-1 py-2 px-3 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-medium"
            >
              + Category
            </button>
            <button
              onClick={() => openModal('project-form')}
              title="Add Project"
              className="flex-1 py-2 px-3 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-medium"
            >
              + Project
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
