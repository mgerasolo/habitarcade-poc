import { useState, useMemo } from 'react';
import * as MuiIcons from '@mui/icons-material';
import { useTimeBlocks } from '../../api';
import { useUIStore } from '../../stores';
import type { TimeBlock, TimeBlockPriority } from '../../types';

/**
 * Manage Priorities Page
 *
 * Features:
 * - View all time block priorities
 * - Group by time block
 * - See completed/pending status
 * - Quick access to time block management
 */
export function ManagePriorities() {
  const { data: timeBlocksData, isLoading } = useTimeBlocks();
  const { openModal } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Get time blocks with priorities
  const timeBlocks = useMemo(() => {
    if (!timeBlocksData?.data) return [];

    let filtered = timeBlocksData.data.filter((tb: TimeBlock) => !tb.isDeleted);

    // Filter by search query (matches time block name or priority title)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tb: TimeBlock) =>
        tb.name.toLowerCase().includes(query) ||
        tb.priorities?.some((p: TimeBlockPriority) =>
          p.title.toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  }, [timeBlocksData, searchQuery]);

  // Calculate priority stats
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;

    timeBlocks.forEach((tb: TimeBlock) => {
      tb.priorities?.forEach((p: TimeBlockPriority) => {
        total++;
        if (p.completedAt) completed++;
      });
    });

    return { total, completed, pending: total - completed };
  }, [timeBlocks]);

  // Toggle block expansion
  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  // Expand all
  const expandAll = () => {
    const allIds = new Set(timeBlocks.map((tb: TimeBlock) => tb.id));
    setExpandedBlocks(allIds);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedBlocks(new Set());
  };

  // Filter priorities by status
  const filterPriorities = (priorities: TimeBlockPriority[] | undefined) => {
    if (!priorities) return [];

    if (filterStatus === 'pending') {
      return priorities.filter(p => !p.completedAt);
    }
    if (filterStatus === 'completed') {
      return priorities.filter(p => !!p.completedAt);
    }
    return priorities;
  };

  // Handle add time block
  const handleAddTimeBlock = () => {
    openModal('time-block-form');
  };

  return (
    <div className="p-6" data-testid="manage-priorities-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <MuiIcons.LowPriority style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Priorities</h1>
            <p className="text-sm text-slate-400">
              {stats.pending} pending, {stats.completed} completed
            </p>
          </div>
        </div>
        <button
          onClick={handleAddTimeBlock}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-amber-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Time Block
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search priorities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'completed'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Expand/Collapse */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-slate-400 hover:text-white text-sm font-medium"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-slate-400 hover:text-white text-sm font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Time Blocks with Priorities */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
          Loading priorities...
        </div>
      ) : timeBlocks.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
          <MuiIcons.Schedule style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
          <p>No time blocks found</p>
          <p className="text-sm mt-1">Create time blocks to manage priorities</p>
          <button
            onClick={handleAddTimeBlock}
            className="mt-4 text-amber-400 hover:text-amber-300 font-medium"
          >
            Create your first time block
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {timeBlocks.map((block: TimeBlock) => {
            const priorities = filterPriorities(block.priorities);
            const isExpanded = expandedBlocks.has(block.id);
            const completedCount = block.priorities?.filter((p: TimeBlockPriority) => p.completedAt).length || 0;
            const totalCount = block.priorities?.length || 0;

            return (
              <div
                key={block.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
              >
                {/* Block Header */}
                <button
                  onClick={() => toggleBlock(block.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                      <MuiIcons.Schedule style={{ color: '#f59e0b', fontSize: 20 }} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-white">{block.name}</h3>
                      <p className="text-sm text-slate-400">
                        {block.durationMinutes} min - {completedCount}/{totalCount} completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress Bar */}
                    {totalCount > 0 && (
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                          style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                      </div>
                    )}
                    <MuiIcons.ExpandMore
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      style={{ fontSize: 24 }}
                    />
                  </div>
                </button>

                {/* Priorities List */}
                {isExpanded && (
                  <div className="border-t border-slate-700 divide-y divide-slate-700/50">
                    {priorities.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        No priorities {filterStatus !== 'all' ? `(${filterStatus})` : ''} in this time block
                      </div>
                    ) : (
                      priorities.map((priority: TimeBlockPriority) => (
                        <div
                          key={priority.id}
                          className="flex items-center justify-between p-4 pl-8 hover:bg-slate-700/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center
                              ${priority.completedAt
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-500'
                              }
                            `}>
                              {priority.completedAt && (
                                <MuiIcons.Check style={{ fontSize: 14, color: 'white' }} />
                              )}
                            </div>
                            <span className={`
                              font-medium
                              ${priority.completedAt ? 'text-slate-400 line-through' : 'text-white'}
                            `}>
                              {priority.title}
                            </span>
                          </div>
                          <div className="text-sm text-slate-500">
                            {priority.completedAt
                              ? `Completed ${new Date(priority.completedAt).toLocaleDateString()}`
                              : 'Pending'
                            }
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
        <div className="flex items-start gap-3">
          <MuiIcons.Info style={{ color: '#94a3b8', fontSize: 20 }} className="mt-0.5" />
          <div className="text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">About Priorities</p>
            <p>
              Priorities are managed within Time Blocks. Each time block can have multiple priorities
              that you want to focus on during that block. Use the Time Block form to add, edit, or
              remove priorities from each block.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagePriorities;
