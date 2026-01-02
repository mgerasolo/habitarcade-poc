import { useUIStore, useDashboardStore } from '../../stores';
import * as MuiIcons from '@mui/icons-material';

export function Header() {
  const { toggleSidebar, sidebarOpen, toggleRightDrawer, rightDrawerOpen, currentPage } = useUIStore();
  const { isEditMode, toggleEditMode, resetLayout } = useDashboardStore();

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
          {/* Edit Mode toggle - only show on dashboard */}
          {currentPage === 'dashboard' && (
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  {/* Save button */}
                  <button
                    onClick={toggleEditMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors shadow-lg shadow-teal-600/25"
                    aria-label="Save changes"
                    data-testid="save-edit-mode"
                  >
                    <MuiIcons.Check style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Done</span>
                  </button>
                  {/* Reset layout button */}
                  <button
                    onClick={resetLayout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                    aria-label="Reset layout"
                    data-testid="reset-layout"
                  >
                    <MuiIcons.Undo style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEditMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  aria-label="Edit dashboard layout"
                  data-testid="edit-mode-toggle"
                >
                  <MuiIcons.Edit style={{ fontSize: 16 }} />
                  <span className="hidden sm:inline">Edit Layout</span>
                </button>
              )}
            </div>
          )}


          {/* Build info indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-slate-400" title={`Build: ${__BUILD_TIME__} ET`}>
                {__BUILD_TIME__} ET
              </span>
            </div>
          </div>

          {/* Right Drawer Toggle - mirrors left sidebar toggle but flipped */}
          <button
            onClick={toggleRightDrawer}
            data-drawer-toggle
            data-testid="right-drawer-toggle"
            className={`
              w-10 h-10 flex items-center justify-center rounded-xl
              transition-all duration-150 group
              ${rightDrawerOpen
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }
            `}
            aria-label={rightDrawerOpen ? 'Collapse right drawer' : 'Open right drawer'}
            aria-expanded={rightDrawerOpen}
            title={rightDrawerOpen ? 'Collapse panel' : 'Open panel'}
          >
            {rightDrawerOpen ? (
              <MuiIcons.MenuOpen
                style={{ fontSize: 24, transform: 'scaleX(-1)' }}
              />
            ) : (
              <MuiIcons.Menu style={{ fontSize: 24, transform: 'scaleX(-1)' }} />
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
