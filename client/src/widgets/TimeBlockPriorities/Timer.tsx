import { useEffect, useRef, useCallback, useState } from 'react';
import { useTimerStore, formatTime } from '../../stores';
import { useUpdateHabitEntry } from '../../api';

interface TimerProps {
  blockId: string;
  durationMinutes: number;
  linkedHabitId?: string;
  onComplete?: () => void;
}

export function Timer({
  blockId,
  durationMinutes,
  linkedHabitId,
  onComplete,
}: TimerProps) {
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasCompletedRef = useRef(false);

  // Timer store state
  const {
    activeBlockId,
    remainingSeconds,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tick,
    resetTimer,
  } = useTimerStore();

  // Habit mutation for marking linked habit complete
  const updateHabitEntry = useUpdateHabitEntry();

  const isActiveTimer = activeBlockId === blockId;
  const totalSeconds = durationMinutes * 60;
  const progress = isActiveTimer
    ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
    : 0;

  // Timer tick effect
  useEffect(() => {
    if (!isActiveTimer || !isRunning) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActiveTimer, isRunning, tick]);

  // Completion detection
  useEffect(() => {
    if (isActiveTimer && remainingSeconds === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;

      // Play completion sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Audio autoplay might be blocked
        });
      }

      // Show completion prompt if there's a linked habit
      if (linkedHabitId) {
        setShowCompletionPrompt(true);
      }

      onComplete?.();
    }
  }, [isActiveTimer, remainingSeconds, linkedHabitId, onComplete]);

  // Reset completion flag when timer is reset or started
  useEffect(() => {
    if (remainingSeconds > 0) {
      hasCompletedRef.current = false;
    }
  }, [remainingSeconds]);

  const handlePlayPause = useCallback(() => {
    if (!isActiveTimer) {
      startTimer(blockId, durationMinutes);
    } else if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, [isActiveTimer, isRunning, blockId, durationMinutes, startTimer, pauseTimer, resumeTimer]);

  const handleReset = useCallback(() => {
    if (isActiveTimer) {
      resetTimer(durationMinutes);
    }
  }, [isActiveTimer, durationMinutes, resetTimer]);

  const handleStop = useCallback(() => {
    stopTimer();
    setShowCompletionPrompt(false);
    hasCompletedRef.current = false;
  }, [stopTimer]);

  const handleMarkHabitComplete = useCallback(() => {
    if (linkedHabitId) {
      const today = new Date().toISOString().split('T')[0];
      updateHabitEntry.mutate({
        habitId: linkedHabitId,
        date: today,
        status: 'complete',
      });
    }
    setShowCompletionPrompt(false);
    handleStop();
  }, [linkedHabitId, updateHabitEntry, handleStop]);

  const handleDismissPrompt = useCallback(() => {
    setShowCompletionPrompt(false);
    handleStop();
  }, [handleStop]);

  // Calculate SVG circle values for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine display time
  const displaySeconds = isActiveTimer ? remainingSeconds : totalSeconds;
  const displayTime = formatTime(displaySeconds);

  // Determine timer state for styling
  const isComplete = isActiveTimer && remainingSeconds === 0;
  const isLowTime = isActiveTimer && remainingSeconds > 0 && remainingSeconds <= 60;

  return (
    <div className="relative">
      {/* Hidden audio element for completion sound */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQsDNJjv5aF6Pgg0l+PqimYpDBqX6dmJZCoIGZjz3n5oLwsUnPLWfGwvChaZ8tWAbC8LFpny1X9sMAoXmfPUfm0vCxeZ89R+bS8LF5nz1H5tLwsXmfPUfm0vCxeZ89R+bS8LF5nz1H5tLw=="
        preload="auto"
      />

      {/* Timer display with progress ring */}
      <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
        {/* Background circle */}
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-700/50"
          />
          {/* Progress ring */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`
              transition-all duration-300
              ${isComplete ? 'animate-pulse' : ''}
            `}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time display */}
        <div className="relative z-10 flex flex-col items-center">
          <span
            className={`
              text-3xl font-bold font-mono tracking-wider
              transition-colors duration-300
              ${isComplete
                ? 'text-teal-400 animate-pulse'
                : isLowTime
                  ? 'text-amber-400'
                  : 'text-white'
              }
            `}
          >
            {displayTime}
          </span>
          {isActiveTimer && (
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
              {isComplete ? 'Complete!' : isRunning ? 'Running' : 'Paused'}
            </span>
          )}
        </div>

        {/* Glow effect when running */}
        {isActiveTimer && isRunning && (
          <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-xl animate-pulse" />
        )}
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-3 mt-4">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={isComplete}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-200 transform
            ${isComplete
              ? 'bg-slate-700 cursor-not-allowed'
              : isRunning
                ? 'bg-amber-500 hover:bg-amber-400 hover:scale-105 shadow-lg shadow-amber-500/30'
                : 'bg-gradient-to-br from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 hover:scale-105 shadow-lg shadow-teal-500/30'
            }
          `}
        >
          {isActiveTimer && isRunning ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Reset button - only show when timer is active */}
        {isActiveTimer && (
          <button
            onClick={handleReset}
            className="
              w-10 h-10 rounded-full flex items-center justify-center
              bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white
              transition-all duration-200
            "
            title="Reset timer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {/* Stop button - only show when timer is active */}
        {isActiveTimer && (
          <button
            onClick={handleStop}
            className="
              w-10 h-10 rounded-full flex items-center justify-center
              bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300
              transition-all duration-200
            "
            title="Stop timer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        )}
      </div>

      {/* Duration label when not active */}
      {!isActiveTimer && (
        <p className="text-center text-xs text-slate-500 mt-2 font-condensed">
          {durationMinutes} minute{durationMinutes !== 1 ? 's' : ''} block
        </p>
      )}

      {/* Completion prompt modal */}
      {showCompletionPrompt && linkedHabitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="
              relative w-full max-w-sm p-6 rounded-2xl
              bg-gradient-to-br from-slate-800 to-slate-900
              border border-slate-700/50
              shadow-2xl shadow-teal-500/10
              animate-in fade-in zoom-in-95 duration-200
            "
          >
            {/* Success icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2 font-condensed">
              Time Block Complete!
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Mark your linked habit as complete?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDismissPrompt}
                className="
                  flex-1 px-4 py-2.5 rounded-lg
                  bg-slate-700 hover:bg-slate-600
                  text-slate-300 font-medium
                  transition-colors duration-150
                "
              >
                Skip
              </button>
              <button
                onClick={handleMarkHabitComplete}
                className="
                  flex-1 px-4 py-2.5 rounded-lg
                  bg-gradient-to-r from-teal-500 to-blue-500
                  hover:from-teal-400 hover:to-blue-400
                  text-white font-medium
                  shadow-lg shadow-teal-500/20
                  transition-all duration-150
                "
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timer;
