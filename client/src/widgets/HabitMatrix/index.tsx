import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useHabitMatrix, getResponsiveDays, DAYS_CONFIG } from './useHabitMatrix';
import { CategorySection, CategorySectionFlat, CategorySectionSkeleton } from './CategorySection';
import { DateHeader, DateHeaderCompact } from './DateHeader';
import { HabitMatrixProvider } from './HabitMatrixContext';
import { format, addMonths, subMonths } from 'date-fns';
import type { CustomHeaderControls } from '../../components/Dashboard/WidgetContainer';

// Re-export for use by parent components
export { DAYS_CONFIG, getResponsiveDays };

// Configuration constants
const HABIT_NAME_WIDTH_DESKTOP = 140;
const HABIT_NAME_WIDTH_TABLET = 100;
const HABIT_NAME_WIDTH_MOBILE = 80;
const MIN_CELL_SIZE = 16;
const MAX_CELL_SIZE = 28;

interface HabitMatrixProps {
  /** Number of days to show. Auto-responsive if not specified */
  daysToShow?: number;
  /** Use flat (non-collapsible) categories */
  flatCategories?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Callback to provide header controls to parent */
  onHeaderControlsReady?: (controls: CustomHeaderControls) => void;
}

/**
 * HabitMatrix - Core habit tracking visualization widget
 *
 * Features:
 * - Grid display of habits (rows) x dates (columns)
 * - Responsive: 31 days (desktop), 7 days (tablet), 3 days (mobile)
 * - Two-tier interaction: click cycles status, long-press/hover shows all options
 * - Habits grouped by category with collapsible sections
 * - Today's column highlighted
 * - Streak indicators for consistent habits
 *
 * Status colors:
 * - Green (#10b981): Complete
 * - Red (#ef4444): Missed
 * - Blue (#3b82f6): Partial
 * - Gray (#9ca3af): N/A
 * - Yellow (#fbbf24): Exempt
 * - Dark Green (#047857): Extra
 * - Orange (#f97316): Trending
 * - Pink (#ec4899): Pink marker
 */
export function HabitMatrix({
  daysToShow: propDaysToShow,
  flatCategories = false,
  className = '',
  onHeaderControlsReady,
}: HabitMatrixProps) {
  // Container ref for measuring width
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Responsive days calculation
  const [responsiveDays, setResponsiveDays] = useState(() =>
    propDaysToShow ?? getResponsiveDays(typeof window !== 'undefined' ? window.innerWidth : 1200)
  );

  // Current viewing month
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Handle container resize for dynamic cell sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle window resize for responsive days
  useEffect(() => {
    if (propDaysToShow) return; // Skip if days explicitly set

    const handleResize = () => {
      const newDays = getResponsiveDays(window.innerWidth);
      setResponsiveDays(newDays);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propDaysToShow]);

  const daysToShow = propDaysToShow ?? responsiveDays;

  // Get matrix data
  const { dateColumns, categoryGroups, isLoading, isError } = useHabitMatrix(daysToShow);

  // Determine layout mode
  const isCompact = daysToShow <= DAYS_CONFIG.tablet;
  const isMobile = daysToShow <= DAYS_CONFIG.mobile;

  // Responsive habit name width
  const habitNameWidth = useMemo(() => {
    if (isMobile) return HABIT_NAME_WIDTH_MOBILE;
    if (isCompact) return HABIT_NAME_WIDTH_TABLET;
    return HABIT_NAME_WIDTH_DESKTOP;
  }, [isCompact, isMobile]);

  // Calculate cell size based on available width
  const cellSize = useMemo(() => {
    const padding = 32; // px-4 on both sides
    const gap = daysToShow * 2; // gap between cells
    const availableWidth = containerWidth - padding - habitNameWidth - gap - 40; // 40 for category indent
    const calculatedSize = Math.floor(availableWidth / daysToShow);
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, calculatedSize));
  }, [containerWidth, daysToShow, habitNameWidth]);

  // Month navigation handlers
  const navigatePrevMonth = useCallback(() => setCurrentMonth(prev => subMonths(prev, 1)), []);
  const navigateNextMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), []);
  const handleDaysChange = useCallback((days: number) => setResponsiveDays(days), []);

  // Provide header controls to parent via callback
  useEffect(() => {
    if (onHeaderControlsReady) {
      onHeaderControlsReady({
        center: (
          <MonthSelector
            currentMonth={currentMonth}
            onPrevMonth={navigatePrevMonth}
            onNextMonth={navigateNextMonth}
          />
        ),
        right: (
          <ViewToggle
            currentDays={daysToShow}
            onChange={handleDaysChange}
          />
        ),
      });
    }
  }, [onHeaderControlsReady, currentMonth, navigatePrevMonth, navigateNextMonth, daysToShow, handleDaysChange]);

  // Calculate total habits count
  const totalHabits = useMemo(
    () => categoryGroups.reduce((sum, group) => sum + group.habits.length, 0),
    [categoryGroups]
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className={`h-full ${className}`} data-testid="habit-matrix-loading">
        <LoadingSkeleton daysCount={daysToShow} />
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className={`h-full ${className}`} data-testid="habit-matrix-error">
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Render empty state
  if (totalHabits === 0) {
    return (
      <div className={`h-full ${className}`} data-testid="habit-matrix-empty">
        <EmptyState />
      </div>
    );
  }

  const CategoryComponent = flatCategories ? CategorySectionFlat : CategorySection;

  return (
    <HabitMatrixProvider>
      <div
        ref={containerRef}
        className={`
          h-full overflow-hidden flex flex-col
          ${className}
        `}
        data-testid="habit-matrix"
      >
        {/* Matrix content - no internal header, controls are in WidgetContainer */}
        <div className="flex-1 overflow-auto">
          <div style={{ minWidth: habitNameWidth + (cellSize + 2) * daysToShow + 40 }}>
            {/* Date header row showing day numbers */}
            {isMobile ? (
              <DateHeaderCompact dates={dateColumns} habitNameWidth={habitNameWidth} />
            ) : (
              <DateHeader dates={dateColumns} habitNameWidth={habitNameWidth} />
            )}

            {/* Category sections with habits */}
            <div className="space-y-1">
              {categoryGroups.map((group) => (
                <CategoryComponent
                  key={group.category?.id || 'uncategorized'}
                  category={group.category}
                  habits={group.habits}
                  dates={dateColumns}
                  habitNameWidth={habitNameWidth}
                  isCompact={isCompact}
                  cellSize={cellSize}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend (desktop only) */}
        {!isCompact && <StatusLegend />}
      </div>
    </HabitMatrixProvider>
  );
}

/**
 * Month selector component for header
 */
function MonthSelector({
  currentMonth,
  onPrevMonth,
  onNextMonth,
}: {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <div className="flex items-center bg-slate-900/60 rounded-full px-1 py-0.5" data-testid="month-selector">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrevMonth();
        }}
        className="p-1 hover:bg-slate-700/50 rounded-full transition-colors text-slate-400 hover:text-white"
        title="Previous month"
        data-testid="prev-month"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span
        className="px-3 py-0.5 text-sm font-condensed font-medium text-slate-200 min-w-[120px] text-center"
        data-testid="current-month"
      >
        {format(currentMonth, 'MMMM yyyy')}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNextMonth();
        }}
        className="p-1 hover:bg-slate-700/50 rounded-full transition-colors text-slate-400 hover:text-white"
        title="Next month"
        data-testid="next-month"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/**
 * View toggle buttons for switching between day views
 */
function ViewToggle({
  currentDays,
  onChange,
}: {
  currentDays: number;
  onChange: (days: number) => void;
}) {
  const options = [
    { label: '3D', days: DAYS_CONFIG.mobile, title: '3 days', testId: 'view-3d' },
    { label: '7D', days: DAYS_CONFIG.tablet, title: '7 days', testId: 'view-7d' },
    { label: 'Mo', days: DAYS_CONFIG.desktop, title: 'Month (31 days)', testId: 'view-month' },
  ];

  return (
    <div className="flex rounded bg-slate-900/50 p-0.5" data-testid="view-toggle">
      {options.map(({ label, days, title, testId }) => (
        <button
          key={days}
          onClick={(e) => {
            e.stopPropagation();
            onChange(days);
          }}
          title={title}
          data-testid={testId}
          className={`
            px-2 py-0.5 text-xs font-condensed rounded
            transition-all duration-150
            ${currentDays === days
              ? 'bg-teal-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Status color legend
 */
function StatusLegend() {
  const statuses = [
    { status: 'complete', label: 'Done', color: '#10b981' },
    { status: 'missed', label: 'Missed', color: '#ef4444' },
    { status: 'partial', label: 'Partial', color: '#3b82f6' },
    { status: 'exempt', label: 'Exempt', color: '#fbbf24' },
    { status: 'na', label: 'N/A', color: '#9ca3af' },
  ];

  return (
    <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
      <div className="flex items-center gap-4 overflow-x-auto">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider flex-shrink-0">
          Legend:
        </span>
        {statuses.map(({ status, label, color }) => (
          <div key={status} className="flex items-center gap-1 flex-shrink-0">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-slate-400 font-condensed">{label}</span>
          </div>
        ))}
        <span className="text-[10px] text-slate-500 italic ml-auto flex-shrink-0">
          Click to cycle, right-click for more
        </span>
      </div>
    </div>
  );
}

/**
 * Loading skeleton state
 */
function LoadingSkeleton({ daysCount = 31 }: { daysCount?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 bg-slate-700/50 rounded w-24" />
        <div className="h-3 bg-slate-700/30 rounded w-12" />
      </div>

      {/* Date header skeleton */}
      <div className="flex gap-0.5 mb-2">
        <div className="w-[120px]" />
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(daysCount, 31) }).map((_, i) => (
            <div key={i} className="w-4 h-6 bg-slate-700/30 rounded" />
          ))}
        </div>
      </div>

      {/* Category skeletons */}
      <CategorySectionSkeleton habitCount={3} daysCount={daysCount} />
      <CategorySectionSkeleton habitCount={2} daysCount={daysCount} />
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="text-red-400 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h4 className="font-condensed text-slate-200 font-semibold mb-1">
        Failed to load habits
      </h4>
      <p className="text-sm text-slate-400 mb-4">
        There was an error loading your habit data.
      </p>
      <button
        onClick={onRetry}
        className="
          px-4 py-2 bg-teal-600 hover:bg-teal-500
          text-white text-sm font-medium rounded
          transition-colors duration-150
        "
      >
        Try Again
      </button>
    </div>
  );
}

/**
 * Empty state when no habits exist
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-slate-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h4 className="font-condensed text-lg text-slate-200 font-semibold mb-2">
        No habits yet
      </h4>
      <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
        Start building better habits! Add your first habit to begin tracking your progress.
      </p>
      <button
        className="
          px-6 py-2.5
          bg-gradient-to-r from-teal-600 to-blue-600
          hover:from-teal-500 hover:to-blue-500
          text-white font-medium rounded-lg
          shadow-lg shadow-teal-500/20
          transition-all duration-200
          transform hover:scale-105
        "
      >
        Add Your First Habit
      </button>
    </div>
  );
}

export default HabitMatrix;
