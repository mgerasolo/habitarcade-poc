import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import type { MeasurementEntry, MeasurementTarget } from '../../types';

// Register ECharts components
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

interface ChartProps {
  entries: MeasurementEntry[];
  target?: MeasurementTarget;
  unit: string;
}

/**
 * Chart - ECharts line chart for target line graph
 *
 * Displays:
 * - Actual values as solid teal/blue line with area fill
 * - Target line as dashed gray line (linear interpolation)
 * - Today marker
 * - Tooltip with details
 */
export function Chart({ entries, target, unit }: ChartProps) {
  const options = useMemo((): EChartsOption => {
    // Prepare actual data points
    const actualData = entries.map((entry) => ({
      date: entry.date,
      value: entry.value,
    }));

    // Generate target line data points
    const targetData: Array<{ date: string; value: number }> = [];
    if (target) {
      const startDate = new Date(target.startDate);
      const endDate = new Date(target.goalDate);
      const totalDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      // Generate points at key intervals
      const intervals = Math.min(Math.ceil(totalDays / 7), 20); // Weekly points, max 20
      for (let i = 0; i <= intervals; i++) {
        const progress = i / intervals;
        const date = new Date(
          startDate.getTime() + progress * (endDate.getTime() - startDate.getTime())
        );
        const value =
          target.startValue + (target.goalValue - target.startValue) * progress;
        targetData.push({
          date: date.toISOString().split('T')[0],
          value,
        });
      }
    }

    // Get all unique dates for x-axis
    const allDates = [
      ...new Set([
        ...actualData.map((d) => d.date),
        ...targetData.map((d) => d.date),
      ]),
    ].sort();

    // Determine Y-axis range
    const allValues = [
      ...actualData.map((d) => d.value),
      ...targetData.map((d) => d.value),
    ];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1 || 5;

    // Find today's position
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = allDates.indexOf(today);

    return {
      animation: true,
      animationDuration: 500,
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 40,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: '#e2e8f0',
          fontSize: 12,
        },
        formatter: (params: unknown) => {
          const items = params as Array<{
            seriesName: string;
            value: number;
            axisValue: string;
            marker: string;
          }>;
          if (!items || items.length === 0) return '';

          const date = new Date(items[0].axisValue).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          let html = `<div class="font-medium mb-1">${date}</div>`;
          items.forEach((item) => {
            if (item.value !== undefined) {
              html += `<div class="flex items-center gap-2">
                ${item.marker}
                <span>${item.seriesName}:</span>
                <span class="font-semibold">${item.value.toFixed(1)} ${unit}</span>
              </div>`;
            }
          });
          return html;
        },
      },
      xAxis: {
        type: 'category',
        data: allDates,
        axisLine: {
          lineStyle: { color: '#334155' },
        },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          interval: Math.floor(allDates.length / 6),
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: Math.floor(minValue - padding),
        max: Math.ceil(maxValue + padding),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: number) => `${value}`,
        },
        splitLine: {
          lineStyle: {
            color: '#1e293b',
            type: 'dashed',
          },
        },
      },
      series: [
        // Actual values line
        {
          name: 'Actual',
          type: 'line',
          data: allDates.map((date) => {
            const point = actualData.find((d) => d.date === date);
            return point ? point.value : null;
          }),
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: '#14b8a6',
            width: 2,
          },
          itemStyle: {
            color: '#14b8a6',
            borderColor: '#0d9488',
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(20, 184, 166, 0.3)' },
              { offset: 1, color: 'rgba(20, 184, 166, 0.02)' },
            ]),
          },
          connectNulls: true,
          markLine:
            todayIndex >= 0
              ? {
                  silent: true,
                  symbol: 'none',
                  data: [{ xAxis: today }],
                  lineStyle: {
                    color: '#f59e0b',
                    type: 'solid',
                    width: 1,
                  },
                  label: {
                    show: true,
                    position: 'start',
                    formatter: 'Today',
                    color: '#f59e0b',
                    fontSize: 9,
                  },
                }
              : undefined,
        },
        // Target line
        ...(target
          ? [
              {
                name: 'Target',
                type: 'line' as const,
                data: allDates.map((date) => {
                  // Calculate target value for this date
                  const currentDate = new Date(date);
                  const startDate = new Date(target.startDate);
                  const endDate = new Date(target.goalDate);
                  const totalDays =
                    (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24);
                  const daysPassed =
                    (currentDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24);

                  if (daysPassed < 0 || daysPassed > totalDays) return null;

                  const progress = daysPassed / totalDays;
                  return (
                    target.startValue +
                    (target.goalValue - target.startValue) * progress
                  );
                }),
                smooth: false,
                symbol: 'none',
                lineStyle: {
                  color: '#64748b',
                  width: 2,
                  type: 'dashed' as const,
                },
                connectNulls: false,
              },
            ]
          : []),
      ],
    };
  }, [entries, target, unit]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={options}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
}

export default Chart;
