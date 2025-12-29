import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  // State
  activeBlockId: string | null;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number | null;

  // Actions
  startTimer: (blockId: string, durationMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  resetTimer: (durationMinutes: number) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeBlockId: null,
      remainingSeconds: 0,
      isRunning: false,
      startedAt: null,

      startTimer: (blockId, durationMinutes) => set({
        activeBlockId: blockId,
        remainingSeconds: durationMinutes * 60,
        isRunning: true,
        startedAt: Date.now(),
      }),

      pauseTimer: () => set({ isRunning: false }),

      resumeTimer: () => set({ isRunning: true, startedAt: Date.now() }),

      stopTimer: () => set({
        activeBlockId: null,
        remainingSeconds: 0,
        isRunning: false,
        startedAt: null,
      }),

      tick: () => {
        const state = get();
        if (state.isRunning && state.remainingSeconds > 0) {
          set({ remainingSeconds: state.remainingSeconds - 1 });
        } else if (state.remainingSeconds <= 0 && state.isRunning) {
          set({ isRunning: false });
        }
      },

      resetTimer: (durationMinutes) => set({
        remainingSeconds: durationMinutes * 60,
        isRunning: false,
      }),
    }),
    {
      name: 'habitarcade-timer',
    }
  )
);

// Selector for formatted time
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
