import { useCallback, useState } from 'react';
import { useDashboardStore } from '../../stores';

/**
 * DashboardHeader - Top navigation bar with dashboard controls
 *
 * Features:
 * - App branding (HabitArcade logo)
 * - Edit mode toggle (lock/unlock)
 * - Layout reset button
 * - Responsive design
 */
export function DashboardHeader() {
  const { isEditMode, toggleEditMode, resetLayout } = useDashboardStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle reset with confirmation
  const handleReset = useCallback(() => {
    if (showResetConfirm) {
      resetLayout();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  }, [showResetConfirm, resetLayout]);

  // Cancel reset confirmation
  const handleCancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  return (
    <header
      className="
        sticky top-0 z-40
        bg-slate-900/95 backdrop-blur-md
        border-b border-slate-700/50
        shadow-lg shadow-slate-900/50
      "
    >
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div
              className="
                w-10 h-10 rounded-lg
                bg-gradient-to-br from-teal-500 to-blue-600
                flex items-center justify-center
                shadow-lg shadow-teal-500/30
              "
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>

            {/* App name */}
            <div className="hidden sm:block">
              <h1
                className="
                  text-xl font-bold font-condensed
                  bg-gradient-to-r from-teal-400 to-blue-400
                  bg-clip-text text-transparent
                "
              >
                HabitArcade
              </h1>
              <p className="text-xs text-slate-400 -mt-0.5">
                Gamify Your Habits
              </p>
            </div>
          </div>

          {/* Center section - Date display */}
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-condensed">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-2">
            {/* Reset Layout button */}
            {isEditMode && (
              <div className="flex items-center gap-2">
                {showResetConfirm ? (
                  <>
                    <span className="text-xs text-amber-400 font-condensed hidden sm:inline">
                      Reset to default?
                    </span>
                    <button
                      onClick={handleReset}
                      className="
                        px-3 py-1.5 rounded-lg text-sm font-medium
                        bg-amber-600 hover:bg-amber-500
                        text-white
                        transition-colors duration-150
                      "
                    >
                      Confirm
                    </button>
                    <button
                      onClick={handleCancelReset}
                      className="
                        px-3 py-1.5 rounded-lg text-sm font-medium
                        bg-slate-700 hover:bg-slate-600
                        text-slate-200
                        transition-colors duration-150
                      "
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleReset}
                    className="
                      px-3 py-1.5 rounded-lg text-sm font-medium font-condensed
                      bg-slate-700/50 hover:bg-slate-700
                      text-slate-300 hover:text-white
                      border border-slate-600/50
                      transition-all duration-150
                      flex items-center gap-2
                    "
                    title="Reset layout to default"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            )}

            {/* Edit Mode Toggle */}
            <button
              onClick={toggleEditMode}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium font-condensed
                transition-all duration-200
                flex items-center gap-2
                ${
                  isEditMode
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50'
                }
              `}
              title={isEditMode ? 'Lock layout' : 'Edit layout'}
            >
              {isEditMode ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Done Editing</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Edit Layout</span>
                  <span className="sm:hidden">Edit</span>
                </>
              )}
            </button>

            {/* User menu placeholder */}
            <div
              className="
                w-9 h-9 rounded-full
                bg-gradient-to-br from-blue-500 to-purple-600
                flex items-center justify-center
                text-white font-bold text-sm
                cursor-pointer
                hover:ring-2 hover:ring-teal-400/50
                transition-all duration-200
              "
              title="User menu"
            >
              HA
            </div>
          </div>
        </div>

        {/* Edit mode info bar */}
        {isEditMode && (
          <div
            className="
              mt-3 px-4 py-2 rounded-lg
              bg-teal-900/30 border border-teal-500/30
              flex items-center gap-4
              text-sm text-teal-200
            "
          >
            <svg
              className="w-5 h-5 text-teal-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <strong>Drag</strong> widget headers to move
              </span>
              <span>
                <strong>Resize</strong> from corners/edges
              </span>
              <span>
                Click <strong>Done Editing</strong> when finished
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default DashboardHeader;
