import { memo, useState, useMemo } from 'react';
import type { DateColumn, MatrixHabit } from './useHabitMatrix';
import type { Category } from '../../types';
import { HabitRow, HabitRowCompact } from './HabitRow';
import { getHabitStatus } from './useHabitMatrix';

interface CategorySectionProps {
  category: Category | null;
  habits: MatrixHabit[];
  dates: DateColumn[];
  habitNameWidth?: number;
  isCompact?: boolean;
  defaultCollapsed?: boolean;
  cellSize?: number;
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
}: CategorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Calculate category stats for header
  const stats = habits.reduce(
    (acc, habit) => {
      const todayDate = dates.find(d => d.isToday)?.date;
      if (todayDate) {
        const entry = habit.entriesByDate.get(todayDate);
        if (entry?.status === 'complete' || entry?.status === 'extra') {
          acc.completedToday++;
        }
      }
      return acc;
    },
    { completedToday: 0 }
  );

  // Calculate completion percentage for each date (for collapsed summary)
  const dailyPercentages = useMemo(() => {
    return dates.map((dateCol) => {
      let complete = 0;
      let eligible = 0;

      habits.forEach((habit) => {
        const status = getHabitStatus(habit, dateCol.date);
        // Eligible = not gray (na) and not blue (partial)
        if (status !== 'na' && status !== 'partial') {
          eligible++;
          // Green = complete or extra
          if (status === 'complete' || status === 'extra') {
            complete++;
          }
        }
      });

      const percentage = eligible > 0 ? Math.round((complete / eligible) * 100) : 0;
      return { date: dateCol.date, percentage, isToday: dateCol.isToday };
    });
  }, [habits, dates]);

  const categoryName = category?.name || 'Uncategorized';
  const categoryIcon = category?.icon;
  const categoryColor = category?.iconColor || '#6b7280';

  // Compact header for uncategorized
  if (!category && habits.length <= 3) {
    return (
      <div className="space-y-0">
        {habits.map((habit) =>
          isCompact ? (
            <HabitRowCompact
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={habitNameWidth}
              cellSize={cellSize}
            />
          ) : (
            <HabitRow
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={habitNameWidth}
              cellSize={cellSize}
            />
          )
        )}
      </div>
    );
  }

  const RowComponent = isCompact ? HabitRowCompact : HabitRow;

  return (
    <div className="mb-2">
      {/* Category header with 20% white overlay */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="
          w-full flex items-center gap-2 py-1.5 px-2 rounded
          bg-white/[0.08] hover:bg-white/[0.12]
          transition-colors duration-150
          group cursor-pointer
        "
        aria-expanded={!isCollapsed}
        aria-controls={`category-${category?.id || 'uncategorized'}`}
      >
        {/* Collapse indicator */}
        <span
          className={`
            text-slate-400 group-hover:text-slate-300
            transition-transform duration-200
            ${isCollapsed ? '' : 'rotate-90'}
          `}
        >
          <svg
            width="12"
            height="12"
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
            className="text-sm opacity-80"
            style={{ color: categoryColor }}
          >
            <i className={categoryIcon} />
          </span>
        )}

        {/* Category name */}
        <span className="font-condensed text-xs font-semibold text-slate-200 uppercase tracking-wider">
          {categoryName}
        </span>

        {/* Habit count badge */}
        <span className="text-[10px] text-slate-400 font-condensed">
          {habits.length} habit{habits.length !== 1 ? 's' : ''}
        </span>

        {/* Today's progress indicator */}
        {stats.completedToday > 0 && (
          <span className="ml-auto text-[10px] font-condensed text-emerald-400">
            {stats.completedToday}/{habits.length} today
          </span>
        )}
      </button>

      {/* Collapsed summary row with percentages */}
      {isCollapsed && (
        <div className="flex items-center gap-0.5 py-0.5 pl-6 mt-1">
          <div style={{ width: habitNameWidth - 20 }} className="flex-shrink-0" />
          <div className="flex gap-0.5">
            {dailyPercentages.map(({ date, percentage, isToday }) => (
              <div
                key={date}
                className={`
                  flex items-center justify-center rounded-sm
                  ${isToday ? 'ring-2 ring-teal-400 ring-offset-1 ring-offset-slate-800' : ''}
                `}
                style={{
                  width: cellSize || 16,
                  height: cellSize || 16,
                  backgroundColor: percentage === 100 ? '#10b981' : percentage > 0 ? '#10b98140' : '#1e293b',
                }}
              >
                <span
                  className="text-white font-bold leading-none"
                  style={{
                    fontFamily: '"Arial Narrow", "Arial", sans-serif',
                    fontSize: (cellSize || 16) * 0.55,
                  }}
                >
                  {percentage > 0 ? percentage : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habit rows (when expanded) */}
      <div
        id={`category-${category?.id || 'uncategorized'}`}
        className={`
          overflow-hidden transition-all duration-200 ease-out
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
        `}
      >
        <div className="pl-4 border-l border-slate-700/50 ml-1 mt-1">
          {habits.map((habit) => (
            <RowComponent
              key={habit.id}
              habit={habit}
              dates={dates}
              habitNameWidth={habitNameWidth - 20}
              cellSize={cellSize}
            />
          ))}
        </div>
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
}: Omit<CategorySectionProps, 'defaultCollapsed'>) {
  const categoryName = category?.name || 'Uncategorized';
  const categoryIcon = category?.icon;
  const categoryColor = category?.iconColor || '#6b7280';

  const RowComponent = isCompact ? HabitRowCompact : HabitRow;

  return (
    <div className="mb-3">
      {/* Category header - non-interactive with white overlay */}
      {category && (
        <div className="flex items-center gap-2 py-1.5 px-2 mb-1 rounded bg-white/[0.08]">
          {categoryIcon && (
            <span className="text-sm" style={{ color: categoryColor }}>
              <i className={categoryIcon} />
            </span>
          )}
          <span className="font-condensed text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {categoryName}
          </span>
          <span className="text-[10px] text-slate-400 font-condensed">
            {habits.length} habit{habits.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Habit rows */}
      <div className={category ? 'pl-4 border-l border-slate-700/50 ml-1' : ''}>
        {habits.map((habit) => (
          <RowComponent
            key={habit.id}
            habit={habit}
            dates={dates}
            habitNameWidth={category ? habitNameWidth - 20 : habitNameWidth}
            cellSize={cellSize}
          />
        ))}
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
