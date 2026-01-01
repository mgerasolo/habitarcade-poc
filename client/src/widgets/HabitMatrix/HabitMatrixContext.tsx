import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface HabitMatrixContextType {
  hoveredCell: { habitId: string; dateIndex: number } | null;
  setHoveredCell: (cell: { habitId: string; dateIndex: number } | null) => void;
}

const HabitMatrixContext = createContext<HabitMatrixContextType | null>(null);

export function HabitMatrixProvider({ children }: { children: ReactNode }) {
  const [hoveredCell, setHoveredCell] = useState<{ habitId: string; dateIndex: number } | null>(null);

  const handleSetHoveredCell = useCallback((cell: { habitId: string; dateIndex: number } | null) => {
    setHoveredCell(cell);
  }, []);

  return (
    <HabitMatrixContext.Provider value={{ hoveredCell, setHoveredCell: handleSetHoveredCell }}>
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
