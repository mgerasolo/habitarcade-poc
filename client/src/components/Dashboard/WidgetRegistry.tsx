import { lazy, Suspense, type ReactNode, type ComponentType, useState, useCallback } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import type { CustomHeaderControls } from './WidgetContainer';

// Lazy load all widget components for code splitting
const HabitMatrix = lazy(() => import('../../widgets/HabitMatrix'));
const WeeklyKanban = lazy(() => import('../../widgets/WeeklyKanban'));
const TimeBlockPriorities = lazy(() => import('../../widgets/TimeBlockPriorities'));
const TargetLineGraph = lazy(() => import('../../widgets/TargetLineGraph'));
const ParkingLot = lazy(() => import('../../widgets/ParkingLot'));
const QuotesWidget = lazy(() => import('../../widgets/Quotes'));
const VideoClipsWidget = lazy(() => import('../../widgets/VideoClips'));

// Days configuration for view toggle
const DAYS_CONFIG = {
  mobile: 3,
  tablet: 7,
  desktop: 31,
};

/**
 * Month selector component for HabitMatrix header
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
 * View toggle component for HabitMatrix header
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
 * Hook to manage HabitMatrix header controls state
 */
export function useHabitMatrixHeaderControls() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [responsiveDays, setResponsiveDays] = useState(DAYS_CONFIG.desktop);

  const navigatePrevMonth = useCallback(() => setCurrentMonth(prev => subMonths(prev, 1)), []);
  const navigateNextMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), []);
  const handleDaysChange = useCallback((days: number) => setResponsiveDays(days), []);

  const headerControls: CustomHeaderControls = {
    center: (
      <MonthSelector
        currentMonth={currentMonth}
        onPrevMonth={navigatePrevMonth}
        onNextMonth={navigateNextMonth}
      />
    ),
    right: (
      <ViewToggle
        currentDays={responsiveDays}
        onChange={handleDaysChange}
      />
    ),
  };

  return {
    headerControls,
    responsiveDays,
  };
}

/**
 * Widget registry mapping widget IDs to their components
 * Add new widgets here as they are created
 */
const WIDGET_REGISTRY: Record<string, ComponentType> = {
  'habit-matrix': HabitMatrix,
  'weekly-kanban': WeeklyKanban,
  'time-blocks': TimeBlockPriorities,
  'target-graph': TargetLineGraph,
  'parking-lot': ParkingLot,
  'quotes': QuotesWidget,
  'videos': VideoClipsWidget,
};

/**
 * Widget metadata for display and configuration
 */
export interface WidgetMeta {
  id: string;
  title: string;
  description: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  icon: ReactNode;
}

/**
 * Registry of widget metadata
 */
export const WIDGET_META: Record<string, WidgetMeta> = {
  'habit-matrix': {
    id: 'habit-matrix',
    title: 'Habit Matrix',
    description: 'Track daily habits in a grid view with streaks and status indicators',
    defaultSize: { w: 16, h: 12 },
    minSize: { w: 8, h: 6 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  'weekly-kanban': {
    id: 'weekly-kanban',
    title: 'Weekly Tasks',
    description: 'Kanban-style task board organized by day of the week',
    defaultSize: { w: 8, h: 8 },
    minSize: { w: 6, h: 4 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
  },
  'time-blocks': {
    id: 'time-blocks',
    title: 'Time Blocks',
    description: 'Pomodoro-style time blocks with priorities for focused work',
    defaultSize: { w: 8, h: 8 },
    minSize: { w: 4, h: 4 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  'target-graph': {
    id: 'target-graph',
    title: 'Progress Tracker',
    description: 'Line graph showing progress toward measurement goals over time',
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },
  'parking-lot': {
    id: 'parking-lot',
    title: 'Quick Capture',
    description: 'Quick note capture for ideas and tasks to process later',
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 4, h: 3 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  'quotes': {
    id: 'quotes',
    title: 'Quotes',
    description: 'Inspirational quotes to motivate and inspire throughout the day',
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
  'videos': {
    id: 'videos',
    title: 'Video Clips',
    description: 'Short inspirational and motivational video clips',
    defaultSize: { w: 6, h: 8 },
    minSize: { w: 4, h: 6 },
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
};

/**
 * Loading skeleton displayed while widget is being loaded
 */
function WidgetSkeleton() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Skeleton header */}
      <div className="animate-pulse flex items-center gap-2 mb-3">
        <div className="h-4 w-4 bg-slate-700/50 rounded" />
        <div className="h-4 w-24 bg-slate-700/50 rounded" />
      </div>

      {/* Skeleton content */}
      <div className="animate-pulse flex-1 space-y-3">
        <div className="h-3 bg-slate-700/30 rounded w-3/4" />
        <div className="h-3 bg-slate-700/30 rounded w-1/2" />
        <div className="h-3 bg-slate-700/30 rounded w-5/6" />
        <div className="h-3 bg-slate-700/30 rounded w-2/3" />
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="h-8 bg-slate-700/20 rounded" />
          <div className="h-8 bg-slate-700/20 rounded" />
          <div className="h-8 bg-slate-700/20 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Error fallback when widget fails to load
 */
export function WidgetError({ widgetId }: { widgetId: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <div className="text-red-400 mb-3">
        <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h4 className="font-condensed text-slate-200 font-semibold mb-1">Widget Error</h4>
      <p className="text-xs text-slate-400">
        Failed to load: <code className="text-teal-400">{widgetId}</code>
      </p>
    </div>
  );
}

/**
 * Unknown widget placeholder
 */
function UnknownWidget({ widgetId }: { widgetId: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <div className="text-amber-400 mb-3">
        <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h4 className="font-condensed text-slate-200 font-semibold mb-1">Unknown Widget</h4>
      <p className="text-xs text-slate-400">
        Widget not found: <code className="text-amber-400">{widgetId}</code>
      </p>
      <p className="text-xs text-slate-500 mt-2">
        Check that this widget is registered in WidgetRegistry.tsx
      </p>
    </div>
  );
}

/**
 * Get a widget component by ID
 *
 * @param widgetId - The unique identifier for the widget
 * @param props - Optional props to pass to the widget
 * @returns A Suspense-wrapped React node for the widget
 */
export function getWidget(widgetId: string, props?: Record<string, unknown>): ReactNode {
  const Widget = WIDGET_REGISTRY[widgetId];

  if (!Widget) {
    return <UnknownWidget widgetId={widgetId} />;
  }

  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Widget {...props} />
    </Suspense>
  );
}

/**
 * Get list of all available widget IDs
 */
export function getAvailableWidgets(): string[] {
  return Object.keys(WIDGET_REGISTRY);
}

/**
 * Get widget metadata by ID
 */
export function getWidgetMeta(widgetId: string): WidgetMeta | undefined {
  return WIDGET_META[widgetId];
}

/**
 * Check if a widget exists in the registry
 */
export function isValidWidget(widgetId: string): boolean {
  return widgetId in WIDGET_REGISTRY;
}

export default { getWidget, getAvailableWidgets, getWidgetMeta, isValidWidget, WIDGET_META };
