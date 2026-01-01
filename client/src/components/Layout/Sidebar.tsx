import { useUIStore } from '../../stores';
import type { PageType } from '../../stores';
import * as MuiIcons from '@mui/icons-material';

interface NavItem {
  id: PageType;
  icon: keyof typeof MuiIcons;
  label: string;
  action?: () => void;
}

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { openModal, currentPage, setCurrentPage } = useUIStore();

  const NAV_ITEMS: NavItem[] = [
    { id: 'today', icon: 'Today', label: 'Today' },
    { id: 'dashboard', icon: 'Dashboard', label: 'Dashboard' },
    { id: 'habits', icon: 'CheckCircle', label: 'Habits' },
    { id: 'tasks', icon: 'Assignment', label: 'Tasks' },
    { id: 'projects', icon: 'Folder', label: 'Projects' },
    { id: 'analytics', icon: 'BarChart', label: 'Analytics' },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else {
      setCurrentPage(item.id);
    }
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
        {NAV_ITEMS.map((item) => {
          const IconComponent = MuiIcons[item.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              title={!isOpen ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-slate-300 hover:bg-slate-700/50 hover:text-white
                transition-all duration-150
                group
                ${item.id === currentPage ? 'bg-slate-700/30 text-white' : ''}
              `}
            >
              <div className={`
                flex items-center justify-center
                ${isOpen ? 'w-6' : 'w-full'}
              `}>
                <IconComponent
                  style={{ fontSize: 22 }}
                  className="text-current group-hover:scale-110 transition-transform"
                />
              </div>
              {isOpen && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
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
