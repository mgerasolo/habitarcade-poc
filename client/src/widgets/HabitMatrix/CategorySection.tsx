import { memo, useState, useMemo, useCallback } from 'react';
import type { DateColumn, MatrixHabit } from './useHabitMatrix';
import type { Category } from '../../types';
import { HabitRow, HabitRowCompact } from './HabitRow';
import { StatusCell } from './StatusCell';
import { getHabitStatus, getEffectiveHabitStatus, getEffectiveDate, isHabitOnTrack } from './useHabitMatrix';
import { useSettings } from '../../api';
import { useUIStore } from '../../stores';
import { RadialDial } from './RadialDial';

// Storage key for persisting expanded parent habits
const STORAGE_KEY_EXPANDED_PARENTS = 'habitMatrix:expandedParents';

/**
 * Helper component for rendering a habit row inside the CSS Grid
 * Uses display:contents so children participate in parent grid
 */
interface CategoryHabitRowProps {
  habit: MatrixHabit;
  dates: DateColumn[];
  cellSize?: number;
  cellHeight?: number;
  index: number;
  compactVertical: boolean;
  isCompact: boolean;
  isExpanded: boolean;
  onExpandToggle: (habitId: string, expanded: boolean) => void;
  indentLevel?: number;
}

const CategoryHabitRow = memo(function CategoryHabitRow({
  habit,
  dates,
  cellSize,
  cellHeight,
  index,
  compactVertical,
  isExpanded,
  onExpandToggle,
  indentLevel = 0,
}: CategoryHabitRowProps) {
  const { openModal } = useUIStore();
  const { data: settingsResponse } = useSettings();
  const autoMarkPink = settingsResponse?.data?.autoMarkPink ?? false;
  const dayBoundaryHour = settingsResponse?.data?.dayBoundaryHour ?? 0;

  const effectiveToday = useMemo(
    () => getEffectiveDate(new Date(), dayBoundaryHour),
    [dayBoundaryHour]
  );

  const handleHabitClick = useCallback(() => {
    openModal('habit-detail', habit);
  }, [openModal, habit]);

  const hasChildren = !!(habit.childHabits && habit.childHabits.length > 0);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpandToggle(habit.id, !isExpanded);
  }, [onExpandToggle, habit.id, isExpanded]);

  // Calculate completion percentage
  const completionPercent = useMemo(() => {
    let completed = 0;
    let partial = 0;
    let exempt = 0;
    let na = 0;
    let emptyDays = 0;
    let countedCells = 0;
    const includeEmptyInDenominator = habit.grayMissedWhenOnTrack ?? false;
    const todayIndex = dates.findIndex(d => d.isToday);

    for (let i = 0; i < dates.length; i++) {
      const dateCol = dates[i];
      const status = getHabitStatus(habit, dateCol.date);
      const hasEntry = status !== 'empty';

      if (todayIndex >= 0 && i > todayIndex) continue;
      const shouldCount = !dateCol.isToday || hasEntry;
      if (!shouldCount) continue;

      countedCells++;
      switch (status) {
        case 'complete':
        case 'extra':
          completed++;
          break;
        case 'partial':
          partial++;
          break;
        case 'exempt':
          exempt++;
          break;
        case 'na':
          na++;
          break;
        case 'empty':
          emptyDays++;
          break;
      }
    }

    const excluded = exempt + na + (includeEmptyInDenominator ? 0 : emptyDays);
    const effectiveTotal = countedCells - excluded;
    if (effectiveTotal <= 0) return 0;
    return Math.round(((completed + partial * 0.5) / effectiveTotal) * 100);
  }, [habit, dates]);

  const getScoreColor = (pct: number) => {
    const target = habit.targetPercentage ?? 90;
    const warning = habit.warningPercentage ?? 75;
    if (pct >= target) return 'text-emerald-400';
    if (pct >= warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const indentPadding = indentLevel * 16;

  return (
    <>
      {/* Name cell */}
      <div
        style={{ paddingLeft: indentPadding }}
        className={`
          flex items-center min-w-0
          ${compactVertical ? 'gap-1 py-0.5 pr-1' : 'gap-1.5 py-1 pr-2'}
          ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}
          group hover:bg-slate-700/20 transition-colors duration-150
        `}
      >
        {hasChildren ? (
          <button
            onClick={handleExpandClick}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-teal-400 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            >
              <path d="M4 2l4 4-4 4V2z" />
            </svg>
          </button>
        ) : indentLevel > 0 ? (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-600 text-xs">└</span>
        ) : null}

        {habit.icon && !compactVertical && (
          <span
            className="flex-shrink-0 text-sm opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ color: habit.iconColor || '#94a3b8' }}
          >
            <i className={habit.icon} />
          </span>
        )}

        <button
          onClick={handleHabitClick}
          className={`font-condensed truncate text-slate-200 group-hover:text-teal-400 transition-colors duration-150 hover:underline cursor-pointer text-left ${compactVertical ? 'text-[13px]' : 'text-sm'} ${indentLevel > 0 ? 'text-slate-300' : ''}`}
          title={`${habit.name} - Click for details`}
        >
          {habit.name}
        </button>

        {hasChildren && (
          <span className="flex-shrink-0 text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-400">
            {habit.childHabits!.length}
          </span>
        )}
      </div>

      {/* Status cells for each date */}
      {dates.map((dateCol, dateIndex) => {
        let status;
        if (hasChildren && habit.computedStatusByDate) {
          status = habit.computedStatusByDate.get(dateCol.date) || 'empty';
        } else {
          status = getEffectiveHabitStatus(habit, dateCol.date, dateCol.isToday, dateCol.isFuture, autoMarkPink, effectiveToday);
        }

        const dayOfMonth = dateCol.date.split('-')[2].replace(/^0/, '');
        const entry = habit.entriesByDate.get(dateCol.date);
        const currentCount = entry?.count ?? 0;
        const siblingCompleted = habit.siblingCompletedByDate?.get(dateCol.date) ?? false;

        return (
          <div
            key={dateCol.date}
            className={`
              flex items-center justify-center
              ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}
            `}
          >
            <StatusCell
              habitId={habit.id}
              date={dateCol.date}
              dayOfMonth={dayOfMonth}
              dateIndex={dateIndex}
              status={status}
              isToday={dateCol.isToday}
              isWeekend={dateCol.isWeekend}
              size={cellSize}
              cellHeight={cellHeight}
              currentCount={currentCount}
              isParentHabit={hasChildren}
              siblingCompleted={siblingCompleted}
            />
          </div>
        );
      })}

      {/* Percentage cell */}
      {!compactVertical && (
        <div
          className={`
            flex items-center justify-end pr-1 text-xs font-condensed font-medium
            ${getScoreColor(completionPercent)}
            ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}
          `}
          title={`${completionPercent}% completion this period`}
        >
          {completionPercent}%
        </div>
      )}

      {/* Child habits when expanded */}
      {hasChildren && isExpanded && habit.childHabits!.map((child, childIdx) => (
        <CategoryHabitRow
          key={child.id}
          habit={child}
          dates={dates}
          cellSize={cellSize}
          cellHeight={cellHeight}
          index={index + 1 + childIdx}
          compactVertical={compactVertical}
          isCompact={false}
          isExpanded={false}
          onExpandToggle={onExpandToggle}
          indentLevel={indentLevel + 1}
        />
      ))}
    </>
  );
});

interface CategorySectionProps {
  category: Category | null;
  habits: MatrixHabit[];
  dates: DateColumn[];
  habitNameWidth?: number;
  isCompact?: boolean;
  defaultCollapsed?: boolean;
  cellSize?: number;
  cellHeight?: number; // Fixed height for cells (#47)
  /** Compact vertical mode - tighter spacing, minimal headers */
  compactVertical?: boolean;
}

/**
 * Category section that groups habits under a collapsible header
 * Supports both expanded and collapsed states for organization
 */
export const CategorySection = memo(function CategorySection({
  category,
  habits,
  dates,
  habitNameWidth = 120,
  isCompact = false,
  defaultCollapsed = false,
  cellSize,
  cellHeight,
  compactVertical = false,
}: CategorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Get settings for effective status calculation
  const { data: settingsResponse } = useSettings();
  const autoMarkPink = settingsResponse?.data?.autoMarkPink ?? false;
  const dayBoundaryHour = settingsResponse?.data?.dayBoundaryHour ?? 0;

  // Calculate effective today (considering day boundary)
  const effectiveToday = useMemo(
    () => getEffectiveDate(new Date(), dayBoundaryHour),
    [dayBoundaryHour]
  );

  // State for expanded parent habits (persisted to localStorage)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_PARENTS);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  });

  // Handler for expand/collapse toggle
  const handleExpandToggle = useCallback((habitId: string, expanded: boolean) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (expanded) {
        next.add(habitId);
      } else {
        next.delete(habitId);
      }
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED_PARENTS, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Calculate completion percentage for each date (for category header radial dials)
  // Tracks both completion % and "not expected" % (low-frequency habits on track)
  const dailyPercentages = useMemo(() => {
    return dates.map((dateCol) => {
      let complete = 0;
      let expected = 0;      // Habits expected to be done today
      let notExpected = 0;   // Low-frequency habits that are on track (gray)

      habits.forEach((habit) => {
        const rawStatus = getHabitStatus(habit, dateCol.date);
        const effectiveStatus = getEffectiveHabitStatus(
          habit,
          dateCol.date,
          dateCol.isToday,
          dateCol.isFuture,
          autoMarkPink,
          effectiveToday
        );

        // Check if this habit is "not expected" today
        // This happens for low-frequency habits that show as gray_missed (on track)
        // or empty low-frequency habits that are on track
        const isLowFrequency = habit.grayMissedWhenOnTrack ?? false;
        const isOnTrack = isLowFrequency && isHabitOnTrack(habit, effectiveToday);
        const isNotExpectedToday = isOnTrack && (rawStatus === 'empty' || effectiveStatus === 'gray_missed');

        if (isNotExpectedToday) {
          notExpected++;
        } else if (rawStatus !== 'na' && rawStatus !== 'exempt') {
          // This habit is expected today
          expected++;
          if (rawStatus === 'complete' || rawStatus === 'extra') {
            complete++;
          }
        }
        // N/A and Exempt are completely excluded (don't count in total)
      });

      // Calculate percentage of expected habits that are complete
      const percentage = expected > 0 ? Math.round((complete / expected) * 100) : 0;

      // Calculate what % of habits are "not expected" (shown as gray segment)
      // Only count against total that aren't NA/exempt
      const countedHabits = expected + notExpected;
      const notExpectedPercentage = countedHabits > 0 ? Math.round((notExpected / countedHabits) * 100) : 0;

      return { date: dateCol.date, percentage, notExpectedPercentage, isToday: dateCol.isToday };
    });
  }, [habits, dates, autoMarkPink, effectiveToday]);

  const categoryName = category?.name || 'Uncategorized';
  const categoryIcon = category?.icon;
  const categoryColor = category?.iconColor || '#6b7280';

  // Compact header for uncategorized
  if (!category && habits.length <= 3) {
    return (
      <div className="space-y-0">
        {habits.map((habit, index) =>
          isCompact ? (
            <HabitRowCompact
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={habitNameWidth}
              cellSize={cellSize}
              cellHeight={cellHeight}
              index={index}
            />
          ) : (
            <HabitRow
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={habitNameWidth}
              cellSize={cellSize}
              cellHeight={cellHeight}
              index={index}
              isExpanded={expandedParents.has(habit.id)}
              onExpandToggle={handleExpandToggle}
            />
          )
        )}
      </div>
    );
  }

  // CSS Grid template: name column + date columns + optional percentage column
  // Using CSS Grid ensures perfect alignment between category header and habit rows
  const gridTemplateColumns = `${habitNameWidth}px repeat(${dates.length}, 1fr) ${compactVertical ? '' : '40px'}`;

  return (
    <div className={`relative ${compactVertical ? 'mb-0' : 'mb-2'}`} style={{ zIndex: 1 }} data-testid="category-section">
      {/* Category divider line */}
      <div className={`border-t ${compactVertical ? 'border-slate-700/50 mt-0' : 'border-t-2 border-slate-600/80 mt-2'}`} data-testid="category-divider" />

      {/* CSS Grid container for category header + habit rows */}
      <div
        className="grid gap-x-1"
        style={{ gridTemplateColumns }}
      >
        {/* Category header row - name column is clickable, dial cells are not */}
        {/* Name column - clickable to expand/collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls={`category-${category?.id || 'uncategorized'}`}
          data-testid="category-header"
          className={`
            flex items-center min-w-0 rounded-bl
            bg-slate-700/50 hover:bg-slate-700/70
            border-l border-b border-slate-600/40
            transition-colors duration-150 cursor-pointer
            ${compactVertical ? 'gap-1 py-1 pr-1' : 'gap-1.5 py-1.5 pr-2'}
          `}
        >
          {/* Collapse indicator */}
          <span
            className={`
              flex-shrink-0 text-slate-300 hover:text-slate-100
              transition-transform duration-200
              ${isCollapsed ? '' : 'rotate-90'}
            `}
          >
            <svg
              width={compactVertical ? '10' : '14'}
              height={compactVertical ? '10' : '14'}
              viewBox="0 0 12 12"
              fill="currentColor"
              className="transform"
            >
              <path d="M4 2l4 4-4 4V2z" />
            </svg>
          </span>

          {/* Category icon */}
          {categoryIcon && (
            <span
              className={`flex-shrink-0 ${compactVertical ? 'text-xs' : 'text-base'}`}
              style={{ color: categoryColor }}
            >
              <i className={categoryIcon} />
            </span>
          )}

          {/* Category name */}
          <span className={`font-condensed font-bold text-slate-100 uppercase tracking-wider truncate ${compactVertical ? 'text-xs' : 'text-base'}`} data-testid="category-name">
            {categoryName}
          </span>

          {/* Habit count badge */}
          <span className={`flex-shrink-0 text-slate-400 font-condensed ${compactVertical ? 'text-[10px]' : 'text-xs'}`}>
            {habits.length}
          </span>
        </button>

        {/* Radial dial cells for each date - NOT inside the button */}
        {dailyPercentages.map(({ date, percentage, notExpectedPercentage, isToday }, idx) => {
          const dialSize = Math.min((cellSize || 16) - 2, compactVertical ? 14 : 18);
          const dialStroke = dialSize < 14 ? 2 : 2.5;
          const hasData = percentage > 0 || notExpectedPercentage > 0;
          const isLast = idx === dailyPercentages.length - 1;

          return (
            <div
              key={date}
              className={`
                flex items-center justify-center
                bg-slate-700/50
                border-b border-slate-600/40
                ${isLast && compactVertical ? 'rounded-br border-r' : ''}
                ${isToday ? 'ring-1 ring-inset ring-teal-400/50' : ''}
                ${compactVertical ? 'py-1' : 'py-1.5'}
              `}
            >
                {hasData ? (
                  <RadialDial
                    percentage={percentage}
                    notExpectedPercentage={notExpectedPercentage}
                    size={dialSize}
                    strokeWidth={dialStroke}
                  />
                ) : (
                  <div
                    className="rounded-full bg-slate-800/50"
                    style={{ width: dialSize * 0.6, height: dialSize * 0.6 }}
                  />
                )}
              </div>
            );
          })}

        {/* Percentage column placeholder (to match habit rows) */}
        {!compactVertical && (
          <div className="flex items-center justify-end bg-slate-700/50 border-b border-r border-slate-600/40 rounded-br py-1 pr-1" />
        )}

        {/* Habit rows (when expanded) */}
        {!isCollapsed && habits.map((habit, index) => (
          <CategoryHabitRow
            key={habit.id}
            habit={habit}
            dates={dates}
            cellSize={cellSize}
            cellHeight={cellHeight}
            index={index}
            compactVertical={compactVertical}
            isCompact={isCompact}
            isExpanded={expandedParents.has(habit.id)}
            onExpandToggle={handleExpandToggle}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Flat category section without collapse functionality
 * Useful for single-category views or mobile
 */
export const CategorySectionFlat = memo(function CategorySectionFlat({
  category,
  habits,
  dates,
  habitNameWidth = 120,
  isCompact = false,
  cellSize,
  cellHeight,
  compactVertical = false,
}: Omit<CategorySectionProps, 'defaultCollapsed'>) {
  const categoryName = category?.name || 'Uncategorized';
  const categoryIcon = category?.icon;
  const categoryColor = category?.iconColor || '#6b7280';

  // Get settings for effective status calculation
  const { data: settingsResponse } = useSettings();
  const autoMarkPink = settingsResponse?.data?.autoMarkPink ?? false;
  const dayBoundaryHour = settingsResponse?.data?.dayBoundaryHour ?? 0;

  // Calculate effective today (considering day boundary)
  const effectiveToday = useMemo(
    () => getEffectiveDate(new Date(), dayBoundaryHour),
    [dayBoundaryHour]
  );

  // Calculate completion percentage for each date (for category header radial dials)
  // Tracks both completion % and "not expected" % (low-frequency habits on track)
  const dailyPercentages = useMemo(() => {
    return dates.map((dateCol) => {
      let complete = 0;
      let expected = 0;
      let notExpected = 0;

      habits.forEach((habit) => {
        const rawStatus = getHabitStatus(habit, dateCol.date);
        const effectiveStatus = getEffectiveHabitStatus(
          habit,
          dateCol.date,
          dateCol.isToday,
          dateCol.isFuture,
          autoMarkPink,
          effectiveToday
        );

        const isLowFrequency = habit.grayMissedWhenOnTrack ?? false;
        const isOnTrack = isLowFrequency && isHabitOnTrack(habit, effectiveToday);
        const isNotExpectedToday = isOnTrack && (rawStatus === 'empty' || effectiveStatus === 'gray_missed');

        if (isNotExpectedToday) {
          notExpected++;
        } else if (rawStatus !== 'na' && rawStatus !== 'exempt') {
          expected++;
          if (rawStatus === 'complete' || rawStatus === 'extra') {
            complete++;
          }
        }
      });

      const percentage = expected > 0 ? Math.round((complete / expected) * 100) : 0;
      const countedHabits = expected + notExpected;
      const notExpectedPercentage = countedHabits > 0 ? Math.round((notExpected / countedHabits) * 100) : 0;

      return { date: dateCol.date, percentage, notExpectedPercentage, isToday: dateCol.isToday };
    });
  }, [habits, dates, autoMarkPink, effectiveToday]);

  // State for expanded parent habits (persisted to localStorage)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPANDED_PARENTS);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  });

  // Handler for expand/collapse toggle
  const handleExpandToggle = useCallback((habitId: string, expanded: boolean) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (expanded) {
        next.add(habitId);
      } else {
        next.delete(habitId);
      }
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED_PARENTS, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  return (
    <div className={compactVertical ? 'mb-0' : 'mb-3'} data-testid="category-section-flat">
      {/* Category header - non-interactive with distinct background */}
      {category && (
        <>
          {/* Category divider line */}
          <div className={`border-t ${compactVertical ? 'border-slate-700/50 mt-0' : 'border-t-2 border-slate-600/80 mt-2'}`} data-testid="category-divider" />

          <div
            className={`flex items-center gap-0.5 rounded-b bg-slate-700/50 border-x border-b border-slate-600/40 ${compactVertical ? 'py-1 mb-0' : 'py-1.5 mb-1'}`}
            data-testid="category-header-flat"
          >
            {/* Left section: habitNameWidth + indent to align with habit rows inside wrapper */}
            <div
              className={`flex-shrink-0 flex items-center min-w-0 ${compactVertical ? 'gap-1 pr-1' : 'gap-1.5 pr-2'}`}
              style={{ width: habitNameWidth + 21 }}
            >
              {categoryIcon && (
                <span className={`flex-shrink-0 ${compactVertical ? 'text-xs' : 'text-base'}`} style={{ color: categoryColor }}>
                  <i className={categoryIcon} />
                </span>
              )}
              <span className={`font-condensed font-bold text-slate-100 uppercase tracking-wider truncate ${compactVertical ? 'text-xs' : 'text-base'}`} data-testid="category-name">
                {categoryName}
              </span>
              <span className={`flex-shrink-0 text-slate-400 font-condensed ${compactVertical ? 'text-[10px]' : 'text-xs'}`}>
                {habits.length}
              </span>
            </div>

            {/* Right section: radial dials - matches HabitRow status cells flex container */}
            <div className="flex gap-1 flex-1">
              {dailyPercentages.map(({ date, percentage, notExpectedPercentage, isToday }) => {
                const dialSize = Math.min((cellSize || 16) - 2, compactVertical ? 14 : 18);
                const dialStroke = dialSize < 14 ? 2 : 2.5;
                const hasData = percentage > 0 || notExpectedPercentage > 0;

                return (
                  <div
                    key={date}
                    className={`
                      flex items-center justify-center
                      ${isToday ? 'ring-1 ring-teal-400 ring-offset-1 ring-offset-slate-700 rounded-full' : ''}
                    `}
                    style={{
                      width: cellSize || 16,
                      height: cellHeight || 18,
                    }}
                  >
                    {hasData ? (
                      <RadialDial
                        percentage={percentage}
                        notExpectedPercentage={notExpectedPercentage}
                        size={dialSize}
                        strokeWidth={dialStroke}
                      />
                    ) : (
                      <div
                        className="rounded-full bg-slate-800/50"
                        style={{ width: dialSize * 0.6, height: dialSize * 0.6 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Habit rows */}
      <div className={category ? `pl-4 border-l border-slate-700/50 ml-1 ${compactVertical ? 'mt-0' : ''}` : ''}>
        {habits.map((habit, index) =>
          isCompact ? (
            <HabitRowCompact
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={category ? habitNameWidth - 20 : habitNameWidth}
              cellSize={cellSize}
              cellHeight={cellHeight}
              index={index}
              compactVertical={compactVertical}
            />
          ) : (
            <HabitRow
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={category ? habitNameWidth - 20 : habitNameWidth}
              cellSize={cellSize}
              cellHeight={cellHeight}
              index={index}
              compactVertical={compactVertical}
              isExpanded={expandedParents.has(habit.id)}
              onExpandToggle={handleExpandToggle}
            />
          )
        )}
      </div>
    </div>
  );
});

/**
 * Skeleton loader for category section
 */
export function CategorySectionSkeleton({
  habitCount = 3,
  daysCount = 31,
}: {
  habitCount?: number;
  daysCount?: number;
}) {
  return (
    <div className="mb-2 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 py-1.5">
        <div className="w-3 h-3 bg-slate-700/50 rounded" />
        <div className="h-3 bg-slate-700/50 rounded w-24" />
        <div className="h-2 bg-slate-700/30 rounded w-12" />
      </div>

      {/* Row skeletons */}
      <div className="pl-4 ml-1 border-l border-slate-700/30">
        {Array.from({ length: habitCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-0.5 py-0.5">
            <div className="w-[100px] flex-shrink-0">
              <div className="h-3 bg-slate-700/30 rounded w-3/4" />
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: daysCount }).map((_, j) => (
                <div key={j} className="w-4 h-4 bg-slate-700/20 rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySection;
