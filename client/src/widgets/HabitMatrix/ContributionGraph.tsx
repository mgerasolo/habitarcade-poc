import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { format, eachDayOfInterval, startOfYear, subWeeks } from 'date-fns';
import { STATUS_COLORS, type HabitStatus, type HabitEntry } from '../../types';

// Register ECharts components
echarts.use([
  HeatmapChart,
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

// Status labels for tooltip
const STATUS_LABELS: Record<HabitStatus, string> = {
  empty: 'No entry',
  complete: 'Complete',
  missed: 'Missed',
  partial: 'Partial',
  na: 'N/A',
  exempt: 'Exempt',
  extra: 'Extra',
  pink: 'Likely Missed',
  gray_missed: 'Missed (low freq)',
};

// Map status to numeric value for visualMap
const STATUS_TO_VALUE: Record<HabitStatus, number> = {
  empty: 0,
  complete: 1,
  missed: 2,
  partial: 3,
  na: 4,
  exempt: 5,
  extra: 6,
  pink: 7,
  gray_missed: 8,
};

// Reverse mapping for tooltip
const VALUE_TO_STATUS: Record<number, HabitStatus> = {
  0: 'empty',
  1: 'complete',
  2: 'missed',
  3: 'partial',
  4: 'na',
  5: 'exempt',
  6: 'extra',
  7: 'pink',
  8: 'gray_missed',
};

interface ContributionGraphProps {
  /** Filter entries by habit ID (if not provided, shows all habits) */
  habitId?: string;
  /** Habit entries to display */
  entries: HabitEntry[];
  /** Custom class name */
  className?: string;
  /** Show full year (true) or last 12 weeks (false, default) */
  fullYear?: boolean;
}

/**
 * ContributionGraph - GitHub-style contribution heatmap using ECharts
 *
 * Shows habit completion data as a calendar heatmap where:
 * - Each cell represents a day
 * - Cell color shows the status (using STATUS_COLORS)
 * - Hover shows date and status details
 */
export function ContributionGraph({
  habitId,
  entries,
  className = '',
  fullYear = false,
}: ContributionGraphProps) {
  // Calculate date range
  const dateRange = useMemo(() => {
    const today = new Date();
    if (fullYear) {
      return {
        start: startOfYear(today),
        end: today,
      };
    } else {
      // Last 12 weeks
      return {
        start: subWeeks(today, 12),
        end: today,
      };
    }
  }, [fullYear]);

  // Create a map of date -> status for quick lookup
  const statusByDate = useMemo(() => {
    const map = new Map<string, HabitStatus>();

    const filteredEntries = habitId
      ? entries.filter((e) => e.habitId === habitId)
      : entries;

    for (const entry of filteredEntries) {
      const dateKey = entry.date; // Already in YYYY-MM-DD format
      // If multiple entries for same date (aggregate mode), prioritize non-empty
      const existing = map.get(dateKey);
      if (!existing || existing === 'empty') {
        map.set(dateKey, entry.status);
      }
    }

    return map;
  }, [entries, habitId]);

  // Generate chart data
  const chartData = useMemo(() => {
    const allDays = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

    return allDays.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const status = statusByDate.get(dateStr) || 'empty';
      return [dateStr, STATUS_TO_VALUE[status]];
    });
  }, [dateRange, statusByDate]);

  // ECharts options
  const options = useMemo((): EChartsOption => {
    const rangeStart = format(dateRange.start, 'yyyy-MM-dd');
    const rangeEnd = format(dateRange.end, 'yyyy-MM-dd');

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e2e8f0',
          fontSize: 12,
        },
        formatter: (params: unknown) => {
          const p = params as { value: [string, number] };
          if (!p.value) return '';

          const [dateStr, statusValue] = p.value;
          const status = VALUE_TO_STATUS[statusValue] || 'empty';
          const statusLabel = STATUS_LABELS[status];
          const statusColor = STATUS_COLORS[status];

          const date = new Date(dateStr);
          const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 500; margin-bottom: 4px;">${formattedDate}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${statusColor}; border-radius: 2px; border: 1px solid rgba(255,255,255,0.2);"></span>
                <span>${statusLabel}</span>
              </div>
            </div>
          `;
        },
      },
      visualMap: {
        show: false,
        type: 'piecewise',
        pieces: [
          { value: 0, color: STATUS_COLORS.empty },
          { value: 1, color: STATUS_COLORS.complete },
          { value: 2, color: STATUS_COLORS.missed },
          { value: 3, color: STATUS_COLORS.partial },
          { value: 4, color: STATUS_COLORS.na },
          { value: 5, color: STATUS_COLORS.exempt },
          { value: 6, color: STATUS_COLORS.extra },
          { value: 7, color: STATUS_COLORS.pink },
          { value: 8, color: STATUS_COLORS.gray_missed },
        ],
      },
      calendar: {
        top: 30,
        left: 30,
        right: 10,
        bottom: 10,
        cellSize: [12, 12],
        range: [rangeStart, rangeEnd],
        itemStyle: {
          borderWidth: 1,
          borderColor: '#334155', // slate-700 - visible border for grid structure
        },
        yearLabel: { show: false },
        dayLabel: {
          show: true,
          firstDay: 0, // Sunday first
          nameMap: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
          color: '#64748b', // slate-500
          fontSize: 10,
        },
        monthLabel: {
          show: true,
          color: '#64748b', // slate-500
          fontSize: 10,
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: chartData,
          itemStyle: {
            borderRadius: 2,
          },
        },
      ],
    };
  }, [dateRange, chartData]);

  // Calculate dynamic height based on view type
  const chartHeight = fullYear ? 160 : 120;

  return (
    <div
      className={`relative ${className}`}
      data-testid="contribution-graph"
      data-chart-engine="echarts"
      data-has-borders="true"
    >
      <ReactEChartsCore
        echarts={echarts}
        option={options}
        style={{ height: chartHeight, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
      />

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-400">
        <span>Empty</span>
        <div
          className="w-[10px] h-[10px] rounded-[2px] border border-slate-600"
          style={{ backgroundColor: STATUS_COLORS.empty }}
        />
        <span className="ml-1">Complete</span>
        <div
          className="w-[10px] h-[10px] rounded-[2px]"
          style={{ backgroundColor: STATUS_COLORS.complete }}
        />
        <span className="ml-1">Missed</span>
        <div
          className="w-[10px] h-[10px] rounded-[2px]"
          style={{ backgroundColor: STATUS_COLORS.missed }}
        />
        <span className="ml-1">Partial</span>
        <div
          className="w-[10px] h-[10px] rounded-[2px]"
          style={{ backgroundColor: STATUS_COLORS.partial }}
        />
        <span className="ml-1">Exempt</span>
        <div
          className="w-[10px] h-[10px] rounded-[2px]"
          style={{ backgroundColor: STATUS_COLORS.exempt }}
        />
      </div>
    </div>
  );
}

export default ContributionGraph;
