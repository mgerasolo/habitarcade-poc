import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  useTimerStore,
  formatTime,
  POMODORO_PRESETS,
  type TimerMode,
} from '../../stores';
import { useUpdateHabitEntry } from '../../api';

interface TimerProps {
  blockId: string;
  durationMinutes: number;
  linkedHabitId?: string;
  onComplete?: () => void;
}

// SVG Circle dimensions
const CIRCLE_SIZE = 200;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Audio context for notification sounds
const createAudioContext = () => {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AudioContextClass();
};

const playNotificationSound = (audioEnabled: boolean) => {
  if (!audioEnabled) return;

  try {
    const audioContext = createAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Play a second tone for distinction
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(1000, audioContext.currentTime);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 200);
  } catch {
    // Audio context may not be available
  }
};

export function Timer({
  blockId,
  durationMinutes,
  linkedHabitId,
  onComplete,
}: TimerProps) {
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [countdownInput, setCountdownInput] = useState(durationMinutes.toString());
  const hasCompletedRef = useRef(false);

  // Timer store state
  const {
    activeBlockId,
    mode,
    status,
    remainingSeconds,
    elapsedSeconds,
    totalSeconds,
    isRunning,
    currentPhase,
    completedSessions,
    pomodoroPresetIndex,
    audioEnabled,
    setMode,
    setPomodoroPreset,
    setAudioEnabled,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tick,
    resetTimer,
    skipToNextPhase,
    resetSessions,
  } = useTimerStore();

  // Habit mutation for marking linked habit complete
  const updateHabitEntry = useUpdateHabitEntry();

  const isActiveTimer = activeBlockId === blockId;

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!isActiveTimer) return 0;

    if (mode === 'stopwatch') {
      // For stopwatch, show elapsed time as a rotating indicator (loops every minute)
      return (elapsedSeconds % 60) / 60;
    } else {
      // For countdown/pomodoro
      if (totalSeconds === 0) return 0;
      return (totalSeconds - remainingSeconds) / totalSeconds;
    }
  }, [isActiveTimer, mode, remainingSeconds, totalSeconds, elapsedSeconds]);

  // Calculate stroke offset for progress ring
  const strokeDashoffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

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
    if (isActiveTimer && status === 'complete' && !hasCompletedRef.current) {
      hasCompletedRef.current = true;

      // Play completion sound
      playNotificationSound(audioEnabled);

      // Show completion prompt if there's a linked habit
      if (linkedHabitId) {
        setShowCompletionPrompt(true);
      }

      onComplete?.();
    }
  }, [isActiveTimer, status, linkedHabitId, onComplete, audioEnabled]);

  // Reset completion flag when timer status changes from complete
  useEffect(() => {
    if (status !== 'complete') {
      hasCompletedRef.current = false;
    }
  }, [status]);

  const handlePlayPause = useCallback(() => {
    if (!isActiveTimer) {
      const minutes = mode === 'countdown' ? parseInt(countdownInput) || durationMinutes : undefined;
      startTimer(blockId, minutes);
    } else if (isRunning) {
      pauseTimer();
    } else if (status === 'paused') {
      resumeTimer();
    } else if (status === 'complete') {
      // For pomodoro, start next phase
      if (mode === 'pomodoro') {
        startTimer(blockId);
      }
    }
  }, [isActiveTimer, isRunning, status, blockId, mode, countdownInput, durationMinutes, startTimer, pauseTimer, resumeTimer]);

  const handleReset = useCallback(() => {
    if (isActiveTimer) {
      const minutes = mode === 'countdown' ? parseInt(countdownInput) || durationMinutes : undefined;
      resetTimer(minutes);
    }
  }, [isActiveTimer, mode, countdownInput, durationMinutes, resetTimer]);

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

  const handleModeChange = useCallback((newMode: TimerMode) => {
    if (status === 'running') return;
    setMode(newMode);
  }, [status, setMode]);

  // Determine display time
  const displayTime = useMemo(() => {
    if (mode === 'stopwatch') {
      return formatTime(isActiveTimer ? elapsedSeconds : 0);
    }

    if (!isActiveTimer && mode === 'pomodoro') {
      const preset = POMODORO_PRESETS[pomodoroPresetIndex];
      return formatTime(preset.workMinutes * 60);
    }

    if (!isActiveTimer && mode === 'countdown') {
      const minutes = parseInt(countdownInput) || durationMinutes;
      return formatTime(minutes * 60);
    }

    return formatTime(remainingSeconds);
  }, [mode, isActiveTimer, elapsedSeconds, remainingSeconds, pomodoroPresetIndex, countdownInput, durationMinutes]);

  // Get color based on status and phase
  const getStatusColor = useCallback(() => {
    if (status === 'complete') return { ring: '#22c55e', text: 'text-green-400', bg: 'bg-green-500' };
    if (status === 'paused') return { ring: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-500' };

    if (mode === 'pomodoro') {
      if (currentPhase === 'work') return { ring: '#14b8a6', text: 'text-teal-400', bg: 'bg-teal-500' };
      if (currentPhase === 'break') return { ring: '#3b82f6', text: 'text-blue-400', bg: 'bg-blue-500' };
      return { ring: '#8b5cf6', text: 'text-purple-400', bg: 'bg-purple-500' }; // Long break
    }

    return { ring: '#14b8a6', text: 'text-teal-400', bg: 'bg-teal-500' };
  }, [status, mode, currentPhase]);

  const colors = getStatusColor();

  // Get phase label for pomodoro
  const getPhaseLabel = () => {
    if (mode !== 'pomodoro') return null;
    if (currentPhase === 'work') return 'Focus';
    if (currentPhase === 'break') return 'Break';
    return 'Long Break';
  };

  // Preset for pomodoro
  const currentPreset = POMODORO_PRESETS[pomodoroPresetIndex];

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Mode Selector */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
        {(['pomodoro', 'stopwatch', 'countdown'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            disabled={status === 'running'}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
              ${mode === m
                ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }
              ${status === 'running' ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            {m === 'pomodoro' ? 'Pomodoro' : m === 'stopwatch' ? 'Stopwatch' : 'Countdown'}
          </button>
        ))}
      </div>

      {/* Pomodoro Preset Selector */}
      {mode === 'pomodoro' && status !== 'running' && (
        <div className="flex gap-2">
          {POMODORO_PRESETS.slice(0, 2).map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => setPomodoroPreset(idx)}
              className={`
                px-3 py-1 text-xs rounded-full transition-all duration-200
                ${pomodoroPresetIndex === idx
                  ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                  : 'bg-slate-700/30 text-slate-400 hover:text-slate-300 border border-transparent'
                }
              `}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Countdown Input */}
      {mode === 'countdown' && status !== 'running' && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="999"
            value={countdownInput}
            onChange={(e) => setCountdownInput(e.target.value)}
            className="w-16 px-2 py-1 text-center text-sm bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
          />
          <span className="text-xs text-slate-400">minutes</span>
        </div>
      )}

      {/* Circular Progress Timer */}
      <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        {/* Background glow effect */}
        {isRunning && (
          <div
            className="absolute inset-4 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${colors.ring}20 0%, transparent 70%)`,
            }}
          />
        )}

        {/* SVG Progress Ring */}
        <svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-slate-700/50"
          />

          {/* Progress ring */}
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.ring}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-300 ${status === 'complete' ? 'animate-pulse' : ''}`}
            style={{
              filter: isRunning ? `drop-shadow(0 0 6px ${colors.ring})` : 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Phase label for pomodoro */}
          {mode === 'pomodoro' && (
            <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              {getPhaseLabel()}
            </span>
          )}

          {/* Time display */}
          <span
            className={`
              text-4xl font-bold font-mono tracking-wider
              transition-colors duration-300
              ${colors.text}
              ${status === 'complete' ? 'animate-pulse' : ''}
            `}
          >
            {displayTime}
          </span>

          {/* Status label */}
          {isActiveTimer && (
            <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              {status === 'complete'
                ? 'Complete!'
                : status === 'running'
                ? mode === 'stopwatch'
                  ? 'Elapsed'
                  : 'Remaining'
                : 'Paused'}
            </span>
          )}
        </div>
      </div>

      {/* Pomodoro Session Indicators */}
      {mode === 'pomodoro' && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {Array.from({ length: currentPreset.sessionsBeforeLongBreak }).map((_, idx) => (
              <div
                key={idx}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${idx < (completedSessions % currentPreset.sessionsBeforeLongBreak) ||
                    (completedSessions > 0 && completedSessions % currentPreset.sessionsBeforeLongBreak === 0 && currentPhase !== 'work')
                    ? 'bg-teal-500 shadow-lg shadow-teal-500/50'
                    : 'bg-slate-600'
                  }
                `}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500">
            {completedSessions} session{completedSessions !== 1 ? 's' : ''}
          </span>
          {completedSessions > 0 && (
            <button
              onClick={resetSessions}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            transition-all duration-200 transform hover:scale-105
            shadow-lg
            ${status === 'running'
              ? 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/30'
              : status === 'complete'
              ? 'bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 shadow-green-500/30'
              : 'bg-gradient-to-br from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 shadow-teal-500/30'
            }
          `}
          aria-label={status === 'running' ? 'Pause' : 'Start'}
        >
          {status === 'running' ? (
            // Pause icon
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : status === 'complete' && mode === 'pomodoro' ? (
            // Next icon
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          ) : (
            // Play icon
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Reset button - only show when timer is active */}
        {isActiveTimer && (
          <button
            onClick={handleReset}
            className="
              w-11 h-11 rounded-full flex items-center justify-center
              bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white
              transition-all duration-200 hover:scale-105
            "
            title="Reset timer"
            aria-label="Reset timer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {/* Skip button - only for pomodoro */}
        {mode === 'pomodoro' && isActiveTimer && status !== 'complete' && (
          <button
            onClick={skipToNextPhase}
            className="
              w-11 h-11 rounded-full flex items-center justify-center
              bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white
              transition-all duration-200 hover:scale-105
            "
            title="Skip to next phase"
            aria-label="Skip to next phase"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        )}

        {/* Stop button - only show when timer is active */}
        {isActiveTimer && (
          <button
            onClick={handleStop}
            className="
              w-11 h-11 rounded-full flex items-center justify-center
              bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300
              transition-all duration-200 hover:scale-105
            "
            title="Stop timer"
            aria-label="Stop timer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        )}
      </div>

      {/* Audio Toggle */}
      <button
        onClick={() => setAudioEnabled(!audioEnabled)}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
          transition-all duration-200
          ${audioEnabled
            ? 'text-teal-400 bg-teal-500/10'
            : 'text-slate-500 bg-slate-700/30'
          }
        `}
        title={audioEnabled ? 'Sound on' : 'Sound off'}
      >
        {audioEnabled ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        )}
        <span>{audioEnabled ? 'On' : 'Off'}</span>
      </button>

      {/* Duration label when not active */}
      {!isActiveTimer && mode === 'countdown' && (
        <p className="text-center text-xs text-slate-500 font-condensed">
          Set duration and press play
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
              shadow-2xl shadow-green-500/10
              animate-in fade-in zoom-in-95 duration-200
            "
          >
            {/* Success icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2 font-condensed">
              {mode === 'pomodoro' ? 'Session Complete!' : 'Timer Complete!'}
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
                  bg-gradient-to-r from-green-500 to-teal-500
                  hover:from-green-400 hover:to-teal-400
                  text-white font-medium
                  shadow-lg shadow-green-500/20
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
