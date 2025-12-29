import { useState, useCallback } from 'react';
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
} from '@dnd-kit/sortable';
import { PriorityItem } from './PriorityItem';
import {
  useTimeBlockPriorities,
  useCreateTimeBlockPriority,
  useUpdateTimeBlockPriority,
  useDeleteTimeBlockPriority,
  useReorderTimeBlockPriorities,
} from '../../api';
import type { TimeBlockPriority } from '../../types';

interface PriorityListProps {
  blockId: string;
  isExpanded: boolean;
}

export function PriorityList({ blockId, isExpanded }: PriorityListProps) {
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [activePriority, setActivePriority] = useState<TimeBlockPriority | null>(null);

  // Fetch priorities for this block
  const { data: prioritiesData, isLoading } = useTimeBlockPriorities(blockId);
  const priorities = prioritiesData?.data ?? [];

  // Mutations
  const createPriority = useCreateTimeBlockPriority();
  const updatePriority = useUpdateTimeBlockPriority();
  const deletePriority = useDeleteTimeBlockPriority();
  const reorderPriorities = useReorderTimeBlockPriorities();

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const priority = priorities.find((p) => p.id === event.active.id);
    if (priority) {
      setActivePriority(priority);
    }
  }, [priorities]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActivePriority(null);

    if (!over || active.id === over.id) return;

    const oldIndex = priorities.findIndex((p) => p.id === active.id);
    const newIndex = priorities.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(priorities, oldIndex, newIndex);
      reorderPriorities.mutate({
        blockId,
        orderedIds: newOrder.map((p) => p.id),
      });
    }
  }, [priorities, blockId, reorderPriorities]);

  const handleToggleComplete = useCallback((priorityId: string) => {
    const priority = priorities.find((p) => p.id === priorityId);
    if (priority) {
      updatePriority.mutate({
        blockId,
        priorityId,
        completedAt: priority.completedAt ? null : new Date().toISOString(),
      });
    }
  }, [priorities, blockId, updatePriority]);

  const handleDelete = useCallback((priorityId: string) => {
    deletePriority.mutate({ blockId, priorityId });
  }, [blockId, deletePriority]);

  const handleAddPriority = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityTitle.trim()) return;

    createPriority.mutate({
      blockId,
      title: newPriorityTitle.trim(),
      sortOrder: priorities.length,
    });
    setNewPriorityTitle('');
  }, [blockId, newPriorityTitle, priorities.length, createPriority]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddPriority(e as unknown as React.FormEvent);
    }
  }, [handleAddPriority]);

  // Sort priorities by sortOrder, completed items at bottom
  const sortedPriorities = [...priorities].sort((a, b) => {
    // Completed items go to bottom
    if (a.completedAt && !b.completedAt) return 1;
    if (!a.completedAt && b.completedAt) return -1;
    return a.sortOrder - b.sortOrder;
  });

  if (!isExpanded) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Priority list with drag and drop */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        </div>
      ) : sortedPriorities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 font-condensed">
            No priorities yet. Add one below!
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedPriorities.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sortedPriorities.map((priority) => (
                <PriorityItem
                  key={priority.id}
                  priority={priority}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activePriority ? (
              <PriorityItem
                priority={activePriority}
                onToggleComplete={() => {}}
                onDelete={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Quick add form */}
      <form onSubmit={handleAddPriority} className="flex gap-2 mt-3">
        <input
          type="text"
          value={newPriorityTitle}
          onChange={(e) => setNewPriorityTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a priority..."
          className="
            flex-1 px-3 py-2 rounded-lg
            bg-slate-800/80 border border-slate-600/50
            text-sm text-slate-200 placeholder-slate-500
            focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
            transition-all duration-150
          "
        />
        <button
          type="submit"
          disabled={!newPriorityTitle.trim() || createPriority.isPending}
          className="
            px-3 py-2 rounded-lg
            bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:cursor-not-allowed
            text-white text-sm font-medium
            transition-colors duration-150
            flex items-center gap-1
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </form>

      {/* Progress indicator */}
      {priorities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-condensed">
              {priorities.filter((p) => p.completedAt).length} of {priorities.length} complete
            </span>
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300"
                style={{
                  width: `${(priorities.filter((p) => p.completedAt).length / priorities.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriorityList;
