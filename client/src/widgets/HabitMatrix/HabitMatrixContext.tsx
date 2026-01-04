import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface HabitMatrixContextType {
  hoveredCell: { habitId: string; dateIndex: number } | null;
  setHoveredCell: (cell: { habitId: string; dateIndex: number } | null) => void;
  activeTooltipCell: { habitId: string; dateIndex: number } | null;
  openTooltip: (cell: { habitId: string; dateIndex: number }) => void;
  closeTooltip: () => void;
  scheduleCloseTooltip: () => void;
  cancelCloseTooltip: () => void;
}

const HabitMatrixContext = createContext<HabitMatrixContextType | null>(null);

export function HabitMatrixProvider({ children }: { children: ReactNode }) {
  const [hoveredCell, setHoveredCell] = useState<{ habitId: string; dateIndex: number } | null>(null);
  const [activeTooltipCell, setActiveTooltipCell] = useState<{ habitId: string; dateIndex: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetHoveredCell = useCallback((cell: { habitId: string; dateIndex: number } | null) => {
    setHoveredCell(cell);
  }, []);

  const openTooltip = useCallback((cell: { habitId: string; dateIndex: number }) => {
    // Cancel any pending close
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveTooltipCell(cell);
  }, []);

  const closeTooltip = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveTooltipCell(null);
  }, []);

  const scheduleCloseTooltip = useCallback(() => {
    // Cancel any existing timer first
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setActiveTooltipCell(null);
      closeTimerRef.current = null;
    }, 500);
  }, []);

  const cancelCloseTooltip = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  return (
    <HabitMatrixContext.Provider value={{
      hoveredCell,
      setHoveredCell: handleSetHoveredCell,
      activeTooltipCell,
      openTooltip,
      closeTooltip,
      scheduleCloseTooltip,
      cancelCloseTooltip,
    }}>
      {children}
    </HabitMatrixContext.Provider>
  );
}

export function useHabitMatrixContext() {
  const context = useContext(HabitMatrixContext);
  if (!context) {
    throw new Error('useHabitMatrixContext must be used within HabitMatrixProvider');
  }
  return context;
}
