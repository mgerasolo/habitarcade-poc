import { useState } from 'react';
import * as MuiIcons from '@mui/icons-material';
import { format, addHours, startOfDay } from 'date-fns';

interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string;
  category?: string;
}

// Generate mock time blocks for today
const today = startOfDay(new Date());
const MOCK_TIME_BLOCKS: TimeBlock[] = [
  {
    id: '1',
    title: 'Morning Routine',
    startTime: addHours(today, 6),
    endTime: addHours(today, 7),
    color: '#f59e0b',
    category: 'Personal',
  },
  {
    id: '2',
    title: 'Deep Work: Project Alpha',
    startTime: addHours(today, 9),
    endTime: addHours(today, 12),
    color: '#14b8a6',
    category: 'Work',
  },
  {
    id: '3',
    title: 'Lunch Break',
    startTime: addHours(today, 12),
    endTime: addHours(today, 13),
    color: '#22c55e',
    category: 'Personal',
  },
  {
    id: '4',
    title: 'Team Meeting',
    startTime: addHours(today, 14),
    endTime: addHours(today, 15),
    color: '#8b5cf6',
    category: 'Work',
  },
  {
    id: '5',
    title: 'Exercise',
    startTime: addHours(today, 17),
    endTime: addHours(today, 18),
    color: '#ef4444',
    category: 'Health',
  },
];

// Generate hour slots from 6 AM to 10 PM
const HOUR_SLOTS = Array.from({ length: 17 }, (_, i) => i + 6);

function TimeBlockItem({ block }: { block: TimeBlock }) {
  const startHour = block.startTime.getHours();
  const endHour = block.endTime.getHours();
  const duration = endHour - startHour;
  const topOffset = (startHour - 6) * 60; // 60px per hour
  const height = duration * 60;

  return (
    <div
      className="absolute left-16 right-4 rounded-lg px-3 py-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: `${block.color}20`,
        borderLeft: `3px solid ${block.color}`,
      }}
    >
      <p className="font-medium text-white text-sm truncate">{block.title}</p>
      <p className="text-xs text-slate-400">
        {format(block.startTime, 'h:mm a')} - {format(block.endTime, 'h:mm a')}
      </p>
      {block.category && (
        <span
          className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
          style={{ backgroundColor: `${block.color}40`, color: block.color }}
        >
          {block.category}
        </span>
      )}
    </div>
  );
}

export function TimeBlocks() {
  const [blocks] = useState<TimeBlock[]>(MOCK_TIME_BLOCKS);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'agenda'>('day');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MuiIcons.Schedule style={{ fontSize: 32 }} className="text-teal-400" />
            Time Blocks
          </h1>
          <p className="text-slate-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['day', 'week', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
          >
            <MuiIcons.Add style={{ fontSize: 20 }} />
            New Block
          </button>
        </div>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="relative" style={{ height: `${17 * 60}px` }}>
            {/* Hour lines */}
            {HOUR_SLOTS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-slate-700/50"
                style={{ top: `${(hour - 6) * 60}px` }}
              >
                <span className="absolute left-2 -top-3 text-xs text-slate-500 bg-slate-800 px-1">
                  {format(addHours(today, hour), 'h a')}
                </span>
              </div>
            ))}

            {/* Time blocks */}
            {blocks.map((block) => (
              <TimeBlockItem key={block.id} block={block} />
            ))}

            {/* Current time indicator */}
            <div
              className="absolute left-12 right-0 border-t-2 border-red-500 z-10"
              style={{
                top: `${(new Date().getHours() - 6) * 60 + new Date().getMinutes()}px`,
              }}
            >
              <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Week View placeholder */}
      {viewMode === 'week' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-8 text-center">
          <MuiIcons.DateRange style={{ fontSize: 64 }} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">Week View</h3>
          <p className="text-slate-500">Week calendar view coming soon...</p>
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {blocks
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
            .map((block) => (
              <div
                key={block.id}
                className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: block.color }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-white">{block.title}</h3>
                  <p className="text-sm text-slate-400">
                    {format(block.startTime, 'h:mm a')} - {format(block.endTime, 'h:mm a')}
                  </p>
                </div>
                {block.category && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${block.color}20`, color: block.color }}
                  >
                    {block.category}
                  </span>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-12">
          <MuiIcons.Schedule style={{ fontSize: 64 }} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No time blocks today</h3>
          <p className="text-slate-500 mb-4">Create your first time block to start planning your day</p>
          <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
            Create Time Block
          </button>
        </div>
      )}
    </div>
  );
}

export default TimeBlocks;
