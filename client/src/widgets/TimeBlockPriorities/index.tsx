import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockCard } from './BlockCard';
import { BlockForm } from './BlockForm';
import {
  useTimeBlocks,
  useDeleteTimeBlock,
  useReorderTimeBlocks,
  useHabits,
} from '../../api';
import { useTimerStore } from '../../stores';
import type { TimeBlock, Habit } from '../../types';

interface TimeBlockPrioritiesProps {
  className?: string;
}

/**
 * SortableBlockCard wrapper to make BlockCard draggable
 */
function SortableBlockCard({
  block,
  linkedHabit,
  onEdit,
  onDelete,
}: {
  block: TimeBlock;
  linkedHabit?: Habit;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 z-10 cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
      </div>
      <BlockCard
        block={block}
        linkedHabit={linkedHabit}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

/**
 * TimeBlockPriorities Widget
 *
 * A focused work session manager with countdown timers and priority lists.
 *
 * Features:
 * - Create and manage time blocks with customizable durations
 * - Countdown timer with visual progress ring
 * - Priority list per block with drag-to-reorder
 * - Link blocks to habits for automatic completion
 * - Drag to reorder blocks
 * - Persisted timer state via Zustand
 */
export function TimeBlockPriorities({ className = '' }: TimeBlockPrioritiesProps) {
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeBlock, setActiveBlock] = useState<TimeBlock | null>(null);

  // Timer store - show active timer indicator
  const activeBlockId = useTimerStore((state) => state.activeBlockId);

  // Fetch time blocks
  const { data: blocksData, isLoading, isError } = useTimeBlocks();
  const blocks = useMemo(() => {
    const allBlocks = blocksData?.data ?? [];
    return allBlocks
      .filter((b) => !b.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [blocksData?.data]);

  // Fetch habits for linking display
  const { data: habitsData } = useHabits();
  const habitsMap = useMemo(() => {
    const map = new Map<string, Habit>();
    (habitsData?.data ?? []).forEach((h) => map.set(h.id, h));
    return map;
  }, [habitsData?.data]);

  // Mutations
  const deleteBlock = useDeleteTimeBlock();
  const reorderBlocks = useReorderTimeBlocks();

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = blocks.find((b) => b.id === event.active.id);
    if (block) {
      setActiveBlock(block);
    }
  }, [blocks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(blocks, oldIndex, newIndex);
      reorderBlocks.mutate(newOrder.map((b) => b.id));
    }
  }, [blocks, reorderBlocks]);

  const handleEdit = useCallback((block: TimeBlock) => {
    setEditingBlock(block);
  }, []);

  const handleDelete = useCallback((blockId: string) => {
    deleteBlock.mutate(blockId);
  }, [deleteBlock]);

  const handleCloseForm = useCallback(() => {
    setEditingBlock(null);
    setShowCreateForm(false);
  }, []);

  // Count active timer blocks
  const hasActiveTimer = blocks.some((b) => b.id === activeBlockId);

  // Render loading state
  if (isLoading) {
    return (
      <div className={`bg-slate-800/80 backdrop-blur rounded-lg p-4 ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className={`bg-slate-800/80 backdrop-blur rounded-lg p-4 ${className}`}>
        <ErrorState />
      </div>
    );
  }

  return (
    <div
      className={`
        bg-slate-800/80 backdrop-blur rounded-lg
        border border-slate-700/50
        h-full flex flex-col
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Timer icon with pulse when active */}
            <div className="relative">
              <svg
                className={`w-5 h-5 ${hasActiveTimer ? 'text-teal-400' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {hasActiveTimer && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              )}
            </div>
            <h3 className="font-condensed font-semibold text-slate-200 text-sm uppercase tracking-wider">
              Time Blocks
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Add block button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="
            flex items-center gap-1.5 px-3 py-1.5
            bg-gradient-to-r from-teal-600 to-blue-600
            hover:from-teal-500 hover:to-blue-500
            text-white text-sm font-medium rounded-lg
            shadow-lg shadow-teal-500/20
            transition-all duration-200
            transform hover:scale-105
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Block
        </button>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-4">
        {blocks.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateForm(true)} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {blocks.map((block) => (
                  <div key={block.id} className="relative">
                    <SortableBlockCard
                      block={block}
                      linkedHabit={block.linkedHabitId ? habitsMap.get(block.linkedHabitId) : undefined}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeBlock ? (
                <div className="opacity-90 shadow-2xl shadow-teal-500/30 rounded-xl">
                  <BlockCard
                    block={activeBlock}
                    linkedHabit={activeBlock.linkedHabitId ? habitsMap.get(activeBlock.linkedHabitId) : undefined}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Create/Edit modal */}
      {(showCreateForm || editingBlock) && (
        <BlockForm
          block={editingBlock}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

/**
 * Empty state when no blocks exist
 */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-teal-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h4 className="font-condensed text-lg text-slate-200 font-semibold mb-2">
        No Time Blocks Yet
      </h4>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        Create focused work sessions with countdown timers and priority lists to boost your productivity.
      </p>
      <button
        onClick={onCreateClick}
        className="
          px-6 py-2.5
          bg-gradient-to-r from-teal-600 to-blue-600
          hover:from-teal-500 hover:to-blue-500
          text-white font-medium rounded-lg
          shadow-lg shadow-teal-500/20
          transition-all duration-200
          transform hover:scale-105
          flex items-center gap-2
        "
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Your First Block
      </button>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-700/50 rounded" />
          <div className="h-4 bg-slate-700/50 rounded w-24" />
        </div>
        <div className="h-8 bg-slate-700/50 rounded w-24" />
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-slate-700/50 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-slate-700/50 rounded w-3/4" />
                <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                <div className="h-3 bg-slate-700/50 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error state
 */
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-red-400 mb-4">
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
        Failed to Load Time Blocks
      </h4>
      <p className="text-sm text-slate-400 mb-4">
        There was an error loading your time blocks.
      </p>
      <button
        onClick={() => window.location.reload()}
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

export default TimeBlockPriorities;
