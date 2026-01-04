import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore, useDashboardStore } from '../../stores';
import type { PageType } from '../../stores';
import { PAGE_ROUTES } from '../../routes';
import * as MuiIcons from '@mui/icons-material';

interface NavItem {
  id: PageType | string;
  icon: keyof typeof MuiIcons;
  label: string;
  action?: () => void;
  children?: NavItem[];
  isDashboardPage?: boolean;
  iconColor?: string;
}

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { openModal, currentPage, setCurrentPage } = useUIStore();
  const { pages, activePageId, setActivePage, createPage } = useDashboardStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['dashboard', 'tasks']));
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  // Build dashboard page children dynamically
  const dashboardPageChildren: NavItem[] = useMemo(() => {
    return pages
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(page => ({
        id: page.id,
        icon: (page.icon as keyof typeof MuiIcons) || 'Dashboard',
        label: page.name,
        isDashboardPage: true,
        iconColor: page.iconColor,
      }));
  }, [pages]);

  // Handle creating a new dashboard page
  const handleCreatePage = useCallback(() => {
    if (!newPageName.trim()) return;
    const newPage = createPage(newPageName.trim());
    setNewPageName('');
    setShowNewPageInput(false);
    setActivePage(newPage.id);
    setCurrentPage('dashboard');
  }, [newPageName, createPage, setActivePage, setCurrentPage]);

  const NAV_ITEMS: NavItem[] = [
    { id: 'today', icon: 'Today', label: 'Today' },
    {
      id: 'dashboard',
      icon: 'Dashboard',
      label: 'Dashboard',
      children: dashboardPageChildren,
    },
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
    { id: 'projects', icon: 'Folder', label: 'Projects' },
    { id: 'targets', icon: 'TrackChanges', label: 'Targets' },
    { id: 'time-blocks', icon: 'Schedule', label: 'Time Blocks' },
    { id: 'analytics', icon: 'BarChart', label: 'Analytics' },
    {
      id: 'manage',
      icon: 'Tune',
      label: 'Manage',
      children: [
        { id: 'manage-habits', icon: 'CheckCircle', label: 'Habits' },
        { id: 'manage-tasks', icon: 'Build', label: 'Maintenance Tasks' },
        { id: 'manage-categories', icon: 'Category', label: 'Categories' },
        { id: 'manage-projects', icon: 'Folder', label: 'Projects' },
        { id: 'manage-tags', icon: 'LocalOffer', label: 'Tags' },
        { id: 'manage-statuses', icon: 'Label', label: 'Statuses' },
        { id: 'manage-priorities', icon: 'LowPriority', label: 'Priorities' },
        { id: 'manage-quotes', icon: 'FormatQuote', label: 'Quotes' },
        { id: 'manage-videos', icon: 'VideoLibrary', label: 'Videos' },
        { id: 'settings', icon: 'Settings', label: 'Settings' },
      ]
    },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.isDashboardPage) {
      // Handle dashboard page clicks - set active page and navigate to dashboard
      setActivePage(item.id);
      setCurrentPage('dashboard');
      navigate(PAGE_ROUTES['dashboard']);
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
      const pageId = item.id as PageType;
      setCurrentPage(pageId);
      // Navigate using React Router directly
      const route = PAGE_ROUTES[pageId];
      if (route) {
        navigate(route);
      }
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    // For dashboard pages, check if it's the active page AND we're on dashboard
    if (item.isDashboardPage) {
      return currentPage === 'dashboard' && activePageId === item.id;
    }
    if (item.id === currentPage) return true;
    if (item.children) {
      return item.children.some(child => {
        if (child.isDashboardPage) {
          return currentPage === 'dashboard' && activePageId === child.id;
        }
        return child.id === currentPage;
      });
    }
    return false;
  };

  const renderNavItem = (item: NavItem, isChild = false, isLast = false) => {
    const IconComponent = MuiIcons[item.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = isItemActive(item);

    // Base classes - left-aligned, no centering
    const commonClasses = `
      w-full flex items-center gap-2 py-2 rounded-lg
      text-slate-300 hover:bg-slate-700/50 hover:text-white
      transition-all duration-150
      group text-left
      ${isChild ? 'pl-8 pr-3' : 'px-3'}
      ${isActive ? 'bg-slate-700/30 text-white' : ''}
    `;

    const iconAndLabel = (
      <>
        <div className="flex items-center justify-center w-5 flex-shrink-0">
          <IconComponent
            style={{ fontSize: isChild ? 16 : 20 }}
            className="text-current group-hover:scale-110 transition-transform"
          />
        </div>
        {isOpen && (
          <>
            <span className={`font-medium ${isChild ? 'text-xs' : 'text-sm'} whitespace-nowrap flex-1 text-left`}>
              {item.label}
            </span>
            {hasChildren && (
              <MuiIcons.ChevronRight
                style={{ fontSize: 16 }}
                className={`transition-transform duration-200 text-slate-500 ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
          </>
        )}
      </>
    );

    return (
      <div key={item.id} className="relative">
        {/* Tree line connectors for child items - file explorer style */}
        {isChild && isOpen && (
          <>
            {/* Vertical line from parent - extends full height unless last item */}
            <div
              className="absolute left-4 top-0 w-px bg-slate-600/60"
              style={{ height: isLast ? '50%' : '100%' }}
            />
            {/* Horizontal line connecting to item */}
            <div className="absolute left-4 top-1/2 w-3 h-px bg-slate-600/60" />
          </>
        )}

        <button
          onClick={() => handleNavClick(item)}
          title={!isOpen ? item.label : undefined}
          data-testid={`nav-${item.id}`}
          className={commonClasses}
        >
          {iconAndLabel}
        </button>

        {/* Render children when expanded with tree structure */}
        {hasChildren && isExpanded && isOpen && (
          <div className="relative mt-0.5" data-testid={`nav-${item.id}-children`}>
            {/* Vertical trunk line for tree structure */}
            <div className="absolute left-4 top-0 bottom-2 w-px bg-slate-600/60" />
            {item.children!.map((child, index) =>
              renderNavItem(child, true, index === item.children!.length - 1 && item.id !== 'dashboard')
            )}
            {/* Add Page button for Dashboard section */}
            {item.id === 'dashboard' && (
              <div className="relative">
                {/* Tree connector for add button */}
                <div className="absolute left-4 top-0 w-px bg-slate-600/60" style={{ height: '50%' }} />
                <div className="absolute left-4 top-1/2 w-3 h-px bg-slate-600/60" />

                {showNewPageInput ? (
                  <div className="pl-8 pr-3 py-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreatePage();
                        if (e.key === 'Escape') {
                          setShowNewPageInput(false);
                          setNewPageName('');
                        }
                      }}
                      placeholder="Page name..."
                      autoFocus
                      className="flex-1 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      onClick={handleCreatePage}
                      className="p-1 text-teal-400 hover:text-teal-300 transition-colors"
                      title="Create page"
                    >
                      <MuiIcons.Check style={{ fontSize: 14 }} />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewPageInput(false);
                        setNewPageName('');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      title="Cancel"
                    >
                      <MuiIcons.Close style={{ fontSize: 14 }} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewPageInput(true)}
                    className="w-full flex items-center gap-2 py-1.5 pl-8 pr-3 text-slate-500 hover:text-teal-400 hover:bg-slate-700/30 rounded-lg transition-colors text-xs"
                    data-testid="add-dashboard-page"
                  >
                    <MuiIcons.Add style={{ fontSize: 14 }} />
                    <span>Add Page</span>
                  </button>
                )}
              </div>
            )}
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
        ${isOpen ? 'w-56' : 'w-14'}
      `}
    >
      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => renderNavItem(item))}
      </nav>

      {/* Quick actions section */}
      <div className={`
        p-2 border-t border-slate-700/50
        ${isOpen ? 'space-y-2' : 'flex flex-col items-center gap-2'}
      `}>
        {/* Add Habit Button */}
        <button
          onClick={() => openModal('habit-form')}
          title={!isOpen ? 'Add Habit' : undefined}
          className={`
            flex items-center gap-2
            bg-gradient-to-r from-teal-600 to-teal-500
            hover:from-teal-500 hover:to-teal-400
            text-white rounded-lg transition-all duration-150
            shadow-lg shadow-teal-600/20 hover:shadow-teal-500/30
            ${isOpen ? 'w-full py-2 px-3 justify-start' : 'w-10 h-10 justify-center'}
          `}
        >
          <MuiIcons.Add style={{ fontSize: isOpen ? 18 : 22 }} />
          {isOpen && <span className="font-medium text-sm">Add Habit</span>}
        </button>

        {/* Add Task Button */}
        <button
          onClick={() => openModal('task-form')}
          title={!isOpen ? 'Add Task' : undefined}
          className={`
            flex items-center gap-2
            bg-slate-700 hover:bg-slate-600
            text-white rounded-lg transition-all duration-150
            ${isOpen ? 'w-full py-2 px-3 justify-start' : 'w-10 h-10 justify-center'}
          `}
        >
          <MuiIcons.AddTask style={{ fontSize: isOpen ? 18 : 22 }} />
          {isOpen && <span className="font-medium text-sm">Add Task</span>}
        </button>

        {/* Collapsed state: More options */}
        {!isOpen && (
          <button
            onClick={() => openModal('category-form')}
            title="Add Category"
            className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <MuiIcons.Category style={{ fontSize: 18 }} />
          </button>
        )}

        {/* Expanded state: Additional quick actions */}
        {isOpen && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => openModal('category-form')}
              title="Add Category"
              className="flex-1 py-1.5 px-2 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-medium"
            >
              + Category
            </button>
            <button
              onClick={() => openModal('project-form')}
              title="Add Project"
              className="flex-1 py-1.5 px-2 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-medium"
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
