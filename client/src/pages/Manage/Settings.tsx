import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useSettings, useUpdateSettings } from '../../api';
import { useSettingsStore } from '../../stores';
import type { ThemeMode, DefaultView, WeekStartDay } from '../../types';

/**
 * Settings Page
 *
 * Features:
 * - View and update application settings
 * - Day boundary hour configuration
 * - Theme selection (dark/light/auto)
 * - Default view preference
 * - Week start day configuration
 * - Data export options
 */
export function Settings() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const settingsStore = useSettingsStore();

  // Local form state
  const [dayBoundaryHour, setDayBoundaryHour] = useState<number>(6);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [defaultView, setDefaultView] = useState<DefaultView>('today');
  const [weekStartDay, setWeekStartDay] = useState<WeekStartDay>(0);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [habitMatrixWeeks, setHabitMatrixWeeks] = useState(4);
  const [isExporting, setIsExporting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form state with server data
  useEffect(() => {
    if (settingsData?.data) {
      const data = settingsData.data;
      setDayBoundaryHour(data.dayBoundaryHour ?? 6);
      setTheme((data.theme as ThemeMode) ?? 'dark');
      setDefaultView((data.defaultView as DefaultView) ?? 'today');
      setWeekStartDay((data.weekStartDay as WeekStartDay) ?? 0);
      setShowCompletedTasks(data.showCompletedTasks ?? true);
      setHabitMatrixWeeks(data.habitMatrixWeeks ?? 4);
    }
  }, [settingsData]);

  // Track changes
  useEffect(() => {
    if (settingsData?.data) {
      const data = settingsData.data;
      const changed =
        dayBoundaryHour !== (data.dayBoundaryHour ?? 6) ||
        theme !== (data.theme ?? 'dark') ||
        defaultView !== (data.defaultView ?? 'today') ||
        weekStartDay !== (data.weekStartDay ?? 0) ||
        showCompletedTasks !== (data.showCompletedTasks ?? true) ||
        habitMatrixWeeks !== (data.habitMatrixWeeks ?? 4);
      setHasChanges(changed);
    }
  }, [dayBoundaryHour, theme, defaultView, weekStartDay, showCompletedTasks, habitMatrixWeeks, settingsData]);

  // Handle save
  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        dayBoundaryHour,
        theme,
        defaultView,
        weekStartDay,
        showCompletedTasks,
        habitMatrixWeeks,
      });

      // Update local store
      settingsStore.syncFromServer({
        dayBoundaryHour,
        theme,
        defaultView,
        weekStartDay,
        showCompletedTasks,
        habitMatrixWeeks,
      });

      toast.success('Settings saved');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  // Handle data export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/settings/export');
      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitarcade-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate hour options
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const label = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
    return { value: hour, label };
  });

  // Week start day options
  const weekDayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Default view options
  const viewOptions = [
    { value: 'today', label: 'Today', icon: MuiIcons.Today },
    { value: 'dashboard', label: 'Dashboard', icon: MuiIcons.Dashboard },
    { value: 'habits', label: 'Habits', icon: MuiIcons.TrackChanges },
  ];

  return (
    <div className="p-6" data-testid="settings-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
          <MuiIcons.Settings style={{ color: 'white', fontSize: 24 }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Configure your HabitArcade experience</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin mx-auto mb-2" />
          Loading settings...
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Theme Setting */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Palette style={{ color: '#9333ea', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Theme</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Choose between dark, light, or auto (follows system preference).
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                      ${theme === 'dark'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }
                    `}
                  >
                    <MuiIcons.DarkMode style={{ fontSize: 18 }} />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                      ${theme === 'light'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }
                    `}
                  >
                    <MuiIcons.LightMode style={{ fontSize: 18 }} />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('auto')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                      ${theme === 'auto'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }
                    `}
                  >
                    <MuiIcons.BrightnessAuto style={{ fontSize: 18 }} />
                    Auto
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Default View Setting */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Home style={{ color: '#06b6d4', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Default View</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Choose which page to show when you open the app.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {viewOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDefaultView(opt.value as DefaultView)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                          ${defaultView === opt.value
                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }
                        `}
                      >
                        <Icon style={{ fontSize: 18 }} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Day Boundary Setting */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Schedule style={{ color: '#3b82f6', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Day Boundary</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Set when a new day starts for habit tracking. Activities before this time
                  will count towards the previous day.
                </p>
                <div className="flex items-center gap-4">
                  <select
                    value={dayBoundaryHour}
                    onChange={(e) => setDayBoundaryHour(parseInt(e.target.value))}
                    className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    {hourOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400 text-sm">
                    Default: 6:00 AM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Week Start Day Setting */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.CalendarMonth style={{ color: '#14b8a6', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Week Start Day</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Choose which day your week starts on for calendar views.
                </p>
                <div className="flex items-center gap-4">
                  <select
                    value={weekStartDay}
                    onChange={(e) => setWeekStartDay(parseInt(e.target.value) as WeekStartDay)}
                    className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                  >
                    {weekDayOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400 text-sm">
                    Default: Sunday
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Visibility style={{ color: '#6366f1', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Display Options</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Customize how data is displayed in the app.
                </p>

                <div className="space-y-4">
                  {/* Show completed tasks toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Show Completed Tasks</p>
                      <p className="text-sm text-slate-400">Display completed tasks in task lists</p>
                    </div>
                    <button
                      onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                        ${showCompletedTasks ? 'bg-indigo-600' : 'bg-slate-600'}
                      `}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                          ${showCompletedTasks ? 'translate-x-7' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Habit matrix weeks */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Habit Matrix Weeks</p>
                      <p className="text-sm text-slate-400">Number of weeks to show in habit matrix</p>
                    </div>
                    <select
                      value={habitMatrixWeeks}
                      onChange={(e) => setHabitMatrixWeeks(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {[2, 3, 4, 5, 6, 8].map((weeks) => (
                        <option key={weeks} value={weeks}>
                          {weeks} weeks
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Setting (Placeholder) */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Notifications style={{ color: '#22c55e', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Configure reminders and notifications for habits and tasks.
                </p>
                <div className="flex items-center gap-4 text-slate-500">
                  <MuiIcons.NotificationsOff style={{ fontSize: 24 }} />
                  <span className="text-sm">Notifications not configured</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Download style={{ color: '#f59e0b', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Data Export</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Export your habits, tasks, projects, and settings as a JSON file.
                </p>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                    ${isExporting
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 border border-amber-600/30'
                    }
                  `}
                >
                  {isExporting ? (
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  ) : (
                    <MuiIcons.FileDownload style={{ fontSize: 18 }} />
                  )}
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-4">
            {hasChanges && (
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <MuiIcons.Warning style={{ fontSize: 16 }} />
                You have unsaved changes
              </p>
            )}
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={updateSettings.isPending || !hasChanges}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${updateSettings.isPending || !hasChanges
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/20'
                }
              `}
            >
              {updateSettings.isPending && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <MuiIcons.Save style={{ fontSize: 20 }} />
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
