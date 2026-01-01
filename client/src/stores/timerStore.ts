import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerMode = 'pomodoro' | 'stopwatch' | 'countdown';
export type TimerPhase = 'work' | 'break' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete';

export interface PomodoroPreset {
  name: string;
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { name: '25/5', workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 },
  { name: '50/10', workMinutes: 50, breakMinutes: 10, longBreakMinutes: 30, sessionsBeforeLongBreak: 4 },
  { name: 'Custom', workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 },
];

interface TimerState {
  // Core state
  activeBlockId: string | null;
  mode: TimerMode;
  status: TimerStatus;

  // Time tracking
  remainingSeconds: number;
  elapsedSeconds: number; // For stopwatch mode
  totalSeconds: number;
  startedAt: number | null;

  // Pomodoro specific
  pomodoroPresetIndex: number;
  customPomodoro: PomodoroPreset;
  currentPhase: TimerPhase;
  completedSessions: number;

  // Audio
  audioEnabled: boolean;

  // Computed helper
  isRunning: boolean;

  // Actions
  setMode: (mode: TimerMode) => void;
  setPomodoroPreset: (index: number) => void;
  setCustomPomodoro: (preset: Partial<PomodoroPreset>) => void;
  setAudioEnabled: (enabled: boolean) => void;

  startTimer: (blockId: string, durationMinutes?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: (durationMinutes?: number) => void;
  tick: () => void;

  // Pomodoro specific
  skipToNextPhase: () => void;
  resetSessions: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeBlockId: null,
      mode: 'pomodoro',
      status: 'idle',
      remainingSeconds: 0,
      elapsedSeconds: 0,
      totalSeconds: 0,
      startedAt: null,
      pomodoroPresetIndex: 0,
      customPomodoro: { name: 'Custom', workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 },
      currentPhase: 'work',
      completedSessions: 0,
      audioEnabled: true,
      isRunning: false,

      setMode: (mode) => {
        const state = get();
        if (state.status === 'running') return; // Don't change mode while running

        set({
          mode,
          status: 'idle',
          remainingSeconds: 0,
          elapsedSeconds: 0,
          currentPhase: 'work',
        });
      },

      setPomodoroPreset: (index) => {
        set({ pomodoroPresetIndex: index });
      },

      setCustomPomodoro: (preset) => {
        set((state) => ({
          customPomodoro: { ...state.customPomodoro, ...preset },
          pomodoroPresetIndex: 2, // Switch to custom
        }));
      },

      setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),

      startTimer: (blockId, durationMinutes) => {
        const state = get();
        const preset = state.pomodoroPresetIndex === 2
          ? state.customPomodoro
          : POMODORO_PRESETS[state.pomodoroPresetIndex];

        let seconds = 0;

        if (state.mode === 'pomodoro') {
          switch (state.currentPhase) {
            case 'work':
              seconds = preset.workMinutes * 60;
              break;
            case 'break':
              seconds = preset.breakMinutes * 60;
              break;
            case 'longBreak':
              seconds = preset.longBreakMinutes * 60;
              break;
          }
        } else if (state.mode === 'countdown' && durationMinutes) {
          seconds = durationMinutes * 60;
        } else if (state.mode === 'stopwatch') {
          seconds = 0; // Stopwatch counts up
        }

        set({
          activeBlockId: blockId,
          remainingSeconds: state.mode === 'stopwatch' ? 0 : seconds,
          elapsedSeconds: 0,
          totalSeconds: seconds,
          status: 'running',
          isRunning: true,
          startedAt: Date.now(),
        });
      },

      pauseTimer: () => set({
        status: 'paused',
        isRunning: false
      }),

      resumeTimer: () => set({
        status: 'running',
        isRunning: true,
        startedAt: Date.now()
      }),

      stopTimer: () => set({
        activeBlockId: null,
        remainingSeconds: 0,
        elapsedSeconds: 0,
        totalSeconds: 0,
        status: 'idle',
        isRunning: false,
        startedAt: null,
        currentPhase: 'work',
      }),

      resetTimer: (durationMinutes) => {
        const state = get();
        const preset = state.pomodoroPresetIndex === 2
          ? state.customPomodoro
          : POMODORO_PRESETS[state.pomodoroPresetIndex];

        let seconds = 0;

        if (state.mode === 'pomodoro') {
          switch (state.currentPhase) {
            case 'work':
              seconds = preset.workMinutes * 60;
              break;
            case 'break':
              seconds = preset.breakMinutes * 60;
              break;
            case 'longBreak':
              seconds = preset.longBreakMinutes * 60;
              break;
          }
        } else if (state.mode === 'countdown' && durationMinutes) {
          seconds = durationMinutes * 60;
        }

        set({
          remainingSeconds: seconds,
          elapsedSeconds: 0,
          totalSeconds: seconds,
          status: 'idle',
          isRunning: false,
        });
      },

      tick: () => {
        const state = get();
        if (state.status !== 'running') return;

        if (state.mode === 'stopwatch') {
          // Count up for stopwatch
          set({ elapsedSeconds: state.elapsedSeconds + 1 });
        } else {
          // Count down for pomodoro and countdown
          if (state.remainingSeconds > 0) {
            set({
              remainingSeconds: state.remainingSeconds - 1,
              elapsedSeconds: state.elapsedSeconds + 1,
            });
          } else {
            // Timer complete
            set({ status: 'complete', isRunning: false });

            // Auto-advance for pomodoro
            if (state.mode === 'pomodoro') {
              const preset = state.pomodoroPresetIndex === 2
                ? state.customPomodoro
                : POMODORO_PRESETS[state.pomodoroPresetIndex];

              if (state.currentPhase === 'work') {
                const newCompletedSessions = state.completedSessions + 1;
                const needsLongBreak = newCompletedSessions % preset.sessionsBeforeLongBreak === 0;

                set({
                  completedSessions: newCompletedSessions,
                  currentPhase: needsLongBreak ? 'longBreak' : 'break',
                });
              } else {
                // After break, go back to work
                set({ currentPhase: 'work' });
              }
            }
          }
        }
      },

      skipToNextPhase: () => {
        const state = get();
        if (state.mode !== 'pomodoro') return;

        const preset = state.pomodoroPresetIndex === 2
          ? state.customPomodoro
          : POMODORO_PRESETS[state.pomodoroPresetIndex];

        let nextPhase: TimerPhase = 'work';
        let newCompletedSessions = state.completedSessions;

        if (state.currentPhase === 'work') {
          newCompletedSessions = state.completedSessions + 1;
          const needsLongBreak = newCompletedSessions % preset.sessionsBeforeLongBreak === 0;
          nextPhase = needsLongBreak ? 'longBreak' : 'break';
        }

        let seconds = 0;
        switch (nextPhase) {
          case 'work':
            seconds = preset.workMinutes * 60;
            break;
          case 'break':
            seconds = preset.breakMinutes * 60;
            break;
          case 'longBreak':
            seconds = preset.longBreakMinutes * 60;
            break;
        }

        set({
          currentPhase: nextPhase,
          completedSessions: newCompletedSessions,
          remainingSeconds: seconds,
          totalSeconds: seconds,
          elapsedSeconds: 0,
          status: 'idle',
          isRunning: false,
        });
      },

      resetSessions: () => set({
        completedSessions: 0,
        currentPhase: 'work',
        status: 'idle',
        isRunning: false,
        remainingSeconds: 0,
        elapsedSeconds: 0,
      }),
    }),
    {
      name: 'habitarcade-timer',
      partialize: (state) => ({
        mode: state.mode,
        pomodoroPresetIndex: state.pomodoroPresetIndex,
        customPomodoro: state.customPomodoro,
        completedSessions: state.completedSessions,
        audioEnabled: state.audioEnabled,
      }),
    }
  )
);

// Selector for formatted time
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format time for display with labels
export const formatTimeVerbose = (seconds: number): { value: string; label: string }[] => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return [
      { value: hrs.toString().padStart(2, '0'), label: 'hrs' },
      { value: mins.toString().padStart(2, '0'), label: 'min' },
      { value: secs.toString().padStart(2, '0'), label: 'sec' },
    ];
  }
  return [
    { value: mins.toString().padStart(2, '0'), label: 'min' },
    { value: secs.toString().padStart(2, '0'), label: 'sec' },
  ];
};
