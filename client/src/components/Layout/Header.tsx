import { useUIStore, useDashboardStore } from '../../stores';
import * as MuiIcons from '@mui/icons-material';

export function Header() {
  const { toggleSidebar, sidebarOpen, viewMode, setViewMode, toggleRightDrawer, rightDrawerOpen, currentPage } = useUIStore();
  const {
    isEditMode,
    toggleEditMode,
    saveAndExitEditMode,
    discardAndExitEditMode,
    resetLayout,
    undoLayoutChange,
    canUndo,
    hasUnsavedChanges,
  } = useDashboardStore();

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
                  {/* Undo button */}
                  <button
                    onClick={undoLayoutChange}
                    disabled={!canUndo()}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${canUndo()
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                        : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                      }
                    `}
                    aria-label="Undo last change"
                    data-testid="undo-layout"
                    title="Undo last change"
                  >
                    <MuiIcons.Undo style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Undo</span>
                  </button>
                  {/* Reset layout button */}
                  <button
                    onClick={resetLayout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                    aria-label="Reset to default layout"
                    data-testid="reset-layout"
                    title="Reset to default layout"
                  >
                    <MuiIcons.RestartAlt style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  {/* Discard changes button */}
                  <button
                    onClick={discardAndExitEditMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                    aria-label="Discard changes"
                    data-testid="discard-edit-mode"
                    title="Discard all changes made this session"
                  >
                    <MuiIcons.Close style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Discard</span>
                  </button>
                  {/* Save button */}
                  <button
                    onClick={saveAndExitEditMode}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors shadow-lg
                      ${hasUnsavedChanges
                        ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/25'
                        : 'bg-teal-600/70 hover:bg-teal-500 shadow-teal-600/15'
                      }
                    `}
                    aria-label="Save changes"
                    data-testid="save-edit-mode"
                    title="Save changes and exit edit mode"
                  >
                    <MuiIcons.Check style={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Done</span>
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

          {/* Right Drawer Toggle */}
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
              <MuiIcons.KeyboardDoubleArrowRight
                style={{ fontSize: 22 }}
                className="group-hover:translate-x-0.5 transition-transform"
              />
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
