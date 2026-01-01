import { useUIStore, useDashboardStore } from '../../stores';
import * as MuiIcons from '@mui/icons-material';

export function Header() {
  const { toggleSidebar, sidebarOpen, viewMode, setViewMode, toggleRightDrawer, rightDrawerOpen, openRightDrawer, setRightDrawerContent, currentPage } = useUIStore();
  const { isEditMode, toggleEditMode } = useDashboardStore();

  // Handler for Edit Layout button
  const handleEditLayoutClick = () => {
    // Toggle edit mode
    toggleEditMode();

    // If we're entering edit mode (not currently in it), open drawer with components tab
    if (!isEditMode) {
      setRightDrawerContent('components');
      openRightDrawer('components');
    }
  };

  // Only show edit layout button on dashboard page
  const showEditLayoutButton = currentPage === 'dashboard' || currentPage === 'today';

  return (
    <header className="sticky top-0 z-50 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50" data-testid="main-header">
      <div className="h-full flex items-center justify-between px-4">
        {/* Left section - Menu toggle & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? (
              <MuiIcons.MenuOpen style={{ fontSize: 24 }} />
            ) : (
              <MuiIcons.Menu style={{ fontSize: 24 }} />
            )}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3" data-testid="header-logo">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <MuiIcons.SportsEsports style={{ fontSize: 22, color: 'white' }} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                HabitArcade
              </h1>
            </div>
          </div>
        </div>

        {/* Right section - View mode & Actions */}
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="hidden sm:flex bg-slate-800 rounded-xl p-1">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                  ${viewMode === mode
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : 'text-slate-400 hover:text-white'
                  }
                `}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Build info indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-slate-400" title={`Build: ${__BUILD_TIME__} ET`}>
                {__BUILD_TIME__} ET
              </span>
            </div>
          </div>

          {/* Edit Layout Button - Only shown on dashboard pages */}
          {showEditLayoutButton && (
            <button
              onClick={handleEditLayoutClick}
              data-testid="edit-layout-button"
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl
                transition-all duration-150 text-sm font-medium
                ${isEditMode
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                }
              `}
              aria-label={isEditMode ? 'Exit edit mode' : 'Edit layout'}
              aria-pressed={isEditMode}
            >
              <MuiIcons.Edit style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">
                {isEditMode ? 'Done' : 'Edit Layout'}
              </span>
            </button>
          )}

          {/* Right Drawer Toggle */}
          <button
            onClick={toggleRightDrawer}
            data-drawer-toggle
            data-testid="right-drawer-toggle"
            className={`
              w-10 h-10 flex items-center justify-center rounded-xl
              transition-all duration-150
              ${rightDrawerOpen
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }
            `}
            aria-label={rightDrawerOpen ? 'Close right drawer' : 'Open right drawer'}
            aria-expanded={rightDrawerOpen}
          >
            {rightDrawerOpen ? (
              <MuiIcons.ChevronRight style={{ fontSize: 24 }} />
            ) : (
              <MuiIcons.ViewSidebar style={{ fontSize: 22 }} />
            )}
          </button>

          {/* User menu / Settings */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="User menu"
          >
            <MuiIcons.AccountCircle style={{ fontSize: 24 }} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
