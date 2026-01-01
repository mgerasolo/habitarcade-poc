import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useSettings, useUpdateSettings } from '../../api';
import type { ThemeMode, WeekStartDay } from '../../types';

/**
 * Settings Page
 *
 * Features:
 * - Time & Date: Day restart time slider (0-23), Week start day toggle
 * - Appearance: Theme toggle (dark/light/auto)
 * - Display: Habit matrix weeks, show completed tasks toggle
 * - Data: Export/Import buttons (placeholders)
 */

// Default settings values
const DEFAULT_SETTINGS = {
  dayBoundaryHour: 6,
  theme: 'light' as ThemeMode,
  weekStartDay: 0 as WeekStartDay,
  showCompletedTasks: true,
  showDeletedItems: false,
  habitMatrixWeeks: 4,
  kanbanDays: 7,
  autoSyncInterval: 30000,
  notificationsEnabled: false,
  autoMarkPink: true,
};

// Days of the week
const WEEK_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// Theme options
const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof MuiIcons }[] = [
  { value: 'light', label: 'Light', icon: 'LightMode' },
  { value: 'dark', label: 'Dark', icon: 'DarkMode' },
  { value: 'auto', label: 'Auto', icon: 'BrightnessAuto' },
];

// Format hour to readable string
function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-blue-600' : 'bg-slate-600'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// Section Header Component
function SectionHeader({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  description,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon style={{ color: iconColor, fontSize: 20 }} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// Setting Row Component
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
      <div className="flex-1">
        <p className="text-white font-medium">{label}</p>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );
}

export function Settings() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Local state for all settings
  const [dayBoundaryHour, setDayBoundaryHour] = useState<number>(DEFAULT_SETTINGS.dayBoundaryHour);
  const [weekStartDay, setWeekStartDay] = useState<WeekStartDay>(DEFAULT_SETTINGS.weekStartDay);
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_SETTINGS.theme);
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(DEFAULT_SETTINGS.showCompletedTasks);
  const [showDeletedItems, setShowDeletedItems] = useState<boolean>(DEFAULT_SETTINGS.showDeletedItems);
  const [habitMatrixWeeks, setHabitMatrixWeeks] = useState<number>(DEFAULT_SETTINGS.habitMatrixWeeks);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(DEFAULT_SETTINGS.notificationsEnabled);
  const [autoMarkPink, setAutoMarkPink] = useState<boolean>(DEFAULT_SETTINGS.autoMarkPink);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      setDayBoundaryHour(s.dayBoundaryHour ?? DEFAULT_SETTINGS.dayBoundaryHour);
      setWeekStartDay((s.weekStartDay ?? DEFAULT_SETTINGS.weekStartDay) as WeekStartDay);
      setTheme((s.theme ?? DEFAULT_SETTINGS.theme) as ThemeMode);
      setShowCompletedTasks(s.showCompletedTasks ?? DEFAULT_SETTINGS.showCompletedTasks);
      setShowDeletedItems(s.showDeletedItems ?? DEFAULT_SETTINGS.showDeletedItems);
      setHabitMatrixWeeks(s.habitMatrixWeeks ?? DEFAULT_SETTINGS.habitMatrixWeeks);
      setNotificationsEnabled(s.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled);
      setAutoMarkPink(s.autoMarkPink ?? DEFAULT_SETTINGS.autoMarkPink);
    }
  }, [settingsData]);

  // Check if any settings have changed
  const hasChanges = () => {
    if (!settingsData?.data) return false;
    const s = settingsData.data;
    return (
      dayBoundaryHour !== (s.dayBoundaryHour ?? DEFAULT_SETTINGS.dayBoundaryHour) ||
      weekStartDay !== (s.weekStartDay ?? DEFAULT_SETTINGS.weekStartDay) ||
      theme !== (s.theme ?? DEFAULT_SETTINGS.theme) ||
      showCompletedTasks !== (s.showCompletedTasks ?? DEFAULT_SETTINGS.showCompletedTasks) ||
      showDeletedItems !== (s.showDeletedItems ?? DEFAULT_SETTINGS.showDeletedItems) ||
      habitMatrixWeeks !== (s.habitMatrixWeeks ?? DEFAULT_SETTINGS.habitMatrixWeeks) ||
      notificationsEnabled !== (s.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled) ||
      autoMarkPink !== (s.autoMarkPink ?? DEFAULT_SETTINGS.autoMarkPink)
    );
  };

  // Handle save
  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        dayBoundaryHour,
        weekStartDay,
        theme,
        showCompletedTasks,
        showDeletedItems,
        habitMatrixWeeks,
        notificationsEnabled,
        autoMarkPink,
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    setDayBoundaryHour(DEFAULT_SETTINGS.dayBoundaryHour);
    setWeekStartDay(DEFAULT_SETTINGS.weekStartDay);
    setTheme(DEFAULT_SETTINGS.theme);
    setShowCompletedTasks(DEFAULT_SETTINGS.showCompletedTasks);
    setShowDeletedItems(DEFAULT_SETTINGS.showDeletedItems);
    setHabitMatrixWeeks(DEFAULT_SETTINGS.habitMatrixWeeks);
    setNotificationsEnabled(DEFAULT_SETTINGS.notificationsEnabled);
    setAutoMarkPink(DEFAULT_SETTINGS.autoMarkPink);
  };

  // Handle export (placeholder)
  const handleExport = () => {
    toast('Export feature coming soon', { icon: '📦' });
  };

  // Handle import (placeholder)
  const handleImport = () => {
    toast('Import feature coming soon', { icon: '📥' });
  };

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
          {/* Section 1: Time & Date */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <SectionHeader
              icon={MuiIcons.Schedule}
              iconColor="#3b82f6"
              iconBgColor="bg-blue-600/20"
              title="Time & Date"
              description="Configure when your day starts and week begins"
            />

            <div className="space-y-1">
              {/* Day Boundary Hour */}
              <SettingRow
                label="Day Restart Time"
                description="Activities before this time count towards the previous day"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={23}
                    value={dayBoundaryHour}
                    onChange={(e) => setDayBoundaryHour(parseInt(e.target.value))}
                    className="w-32 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-white font-medium w-20 text-right">
                    {formatHour(dayBoundaryHour)}
                  </span>
                </div>
              </SettingRow>

              {/* Week Start Day */}
              <SettingRow
                label="Week Start Day"
                description="First day of the week in calendars and habit tracking"
              >
                <select
                  value={weekStartDay}
                  onChange={(e) => setWeekStartDay(parseInt(e.target.value) as WeekStartDay)}
                  className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </SettingRow>
            </div>
          </div>

          {/* Section 2: Appearance */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <SectionHeader
              icon={MuiIcons.Palette}
              iconColor="#9333ea"
              iconBgColor="bg-purple-600/20"
              title="Appearance"
              description="Customize the look and feel of the application"
            />

            <div className="space-y-1">
              {/* Theme Toggle */}
              <SettingRow label="Theme" description="Choose your preferred color scheme">
                <div className="flex items-center gap-2">
                  {THEME_OPTIONS.map((option) => {
                    const IconComponent = MuiIcons[option.icon] as React.ElementType;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                          ${theme === option.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                          }
                        `}
                      >
                        <IconComponent style={{ fontSize: 18 }} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </SettingRow>
            </div>
          </div>

          {/* Section 3: Display */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <SectionHeader
              icon={MuiIcons.ViewModule}
              iconColor="#22c55e"
              iconBgColor="bg-green-600/20"
              title="Display"
              description="Control what content is shown in the application"
            />

            <div className="space-y-1">
              {/* Habit Matrix Weeks */}
              <SettingRow
                label="Habit Matrix Weeks"
                description="Number of weeks shown in the habit tracking matrix"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={habitMatrixWeeks}
                    onChange={(e) => setHabitMatrixWeeks(parseInt(e.target.value))}
                    className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <span className="text-white font-medium w-16 text-right">
                    {habitMatrixWeeks} {habitMatrixWeeks === 1 ? 'week' : 'weeks'}
                  </span>
                </div>
              </SettingRow>

              {/* Show Completed Tasks */}
              <SettingRow
                label="Show Completed Tasks"
                description="Display completed tasks in the kanban and task lists"
              >
                <ToggleSwitch
                  checked={showCompletedTasks}
                  onChange={setShowCompletedTasks}
                />
              </SettingRow>

              {/* Show Deleted Items */}
              <SettingRow
                label="Show Deleted Items"
                description="Display soft-deleted items that can be restored"
              >
                <ToggleSwitch
                  checked={showDeletedItems}
                  onChange={setShowDeletedItems}
                />
              </SettingRow>

              {/* Auto Mark Pink */}
              <SettingRow
                label="Auto-Mark Unfilled Days Pink"
                description="Automatically mark unfilled past days as pink (forgot to log)"
              >
                <ToggleSwitch
                  checked={autoMarkPink}
                  onChange={setAutoMarkPink}
                />
              </SettingRow>
            </div>
          </div>

          {/* Section 4: Notifications */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <SectionHeader
              icon={MuiIcons.Notifications}
              iconColor="#f59e0b"
              iconBgColor="bg-amber-600/20"
              title="Notifications"
              description="Configure reminders and alerts"
            />

            <div className="space-y-1">
              {/* Enable Notifications */}
              <SettingRow
                label="Enable Notifications"
                description="Receive reminders for habits and tasks"
              >
                <ToggleSwitch
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                />
              </SettingRow>
            </div>
          </div>

          {/* Section 5: Data */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <SectionHeader
              icon={MuiIcons.Storage}
              iconColor="#ef4444"
              iconBgColor="bg-red-600/20"
              title="Data"
              description="Export and import your data"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <MuiIcons.FileDownload style={{ fontSize: 18 }} />
                Export Data
              </button>
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <MuiIcons.FileUpload style={{ fontSize: 18 }} />
                Import Data
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <MuiIcons.Refresh style={{ fontSize: 18 }} />
              Reset to Defaults
            </button>

            <button
              onClick={handleSave}
              disabled={updateSettings.isPending || !hasChanges()}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${updateSettings.isPending || !hasChanges()
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
