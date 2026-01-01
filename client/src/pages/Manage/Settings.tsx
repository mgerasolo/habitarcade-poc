import { useState } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useSettings, useUpdateSettings } from '../../api';

/**
 * Settings Page
 *
 * Features:
 * - View and update application settings
 * - Day boundary hour configuration
 * - Theme selection (future)
 */
export function Settings() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [dayBoundaryHour, setDayBoundaryHour] = useState<number>(
    settingsData?.data?.dayBoundaryHour ?? 6
  );

  // Handle save
  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        dayBoundaryHour,
      });
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  // Generate hour options
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const label = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
    return { value: hour, label };
  });

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

          {/* Theme Setting (Placeholder) */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Palette style={{ color: '#9333ea', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">Theme</h3>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Choose between dark and light themes for the application.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-xl text-white opacity-50 cursor-not-allowed"
                  >
                    <MuiIcons.DarkMode style={{ fontSize: 18 }} />
                    Dark
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-xl text-slate-400 opacity-50 cursor-not-allowed"
                  >
                    <MuiIcons.LightMode style={{ fontSize: 18 }} />
                    Light
                  </button>
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

          {/* Data Export (Placeholder) */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                <MuiIcons.Download style={{ color: '#f59e0b', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">Data Export</h3>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Export your habits, tasks, and analytics data.
                </p>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-xl text-slate-500 cursor-not-allowed"
                >
                  <MuiIcons.FileDownload style={{ fontSize: 18 }} />
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${updateSettings.isPending
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
