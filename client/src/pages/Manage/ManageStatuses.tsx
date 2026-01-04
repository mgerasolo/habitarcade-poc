import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
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
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStatusWorkflow, useDeleteStatus, useReorderStatuses } from '../../api';
import { useUIStore } from '../../stores';
import type { TaskStatusEntity } from '../../types';

interface StatusRowProps {
  status: TaskStatusEntity;
  onEdit: (status: TaskStatusEntity) => void;
  onDelete: (status: TaskStatusEntity) => void;
  isBreakout?: boolean;
}

function StatusRow({ status, onEdit, onDelete, isBreakout }: StatusRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Render icon
  const renderIcon = () => {
    if (!status.icon) {
      return (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${status.color}20` }}
        >
          <MuiIcons.Label style={{ color: status.color, fontSize: 18 }} />
        </div>
      );
    }

    if (status.icon.startsWith('material:')) {
      const iconName = status.icon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${status.color}20` }}
          >
            <IconComponent style={{ color: status.color, fontSize: 18 }} />
          </div>
        );
      }
    }

    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${status.color}20` }}
      >
        <i className={status.icon} style={{ color: status.color, fontSize: 16 }} />
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors
        ${isBreakout ? 'ml-8 bg-slate-800/30' : ''}
      `}
    >
      {/* Drag handle */}
      <div className="col-span-1 flex justify-center">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing"
        >
          <MuiIcons.DragIndicator style={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Status Name with color indicator */}
      <div className="col-span-4 flex items-center gap-3">
        {renderIcon()}
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{status.name}</span>
          {status.isInitialStatus && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded">
              INITIAL
            </span>
          )}
          {status.isDefault && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-500/20 text-slate-400 rounded">
              SYSTEM
            </span>
          )}
          {isBreakout && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
              BREAKOUT
            </span>
          )}
        </div>
      </div>

      {/* Color */}
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md border border-slate-600"
            style={{ backgroundColor: status.color }}
          />
          <span className="text-sm text-slate-400 font-mono">{status.color}</span>
        </div>
      </div>

      {/* Workflow Order */}
      <div className="col-span-2 text-sm text-slate-400">
        {status.workflowOrder !== null && status.workflowOrder !== undefined ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg">
            <MuiIcons.Timeline style={{ fontSize: 14 }} />
            Step {status.workflowOrder + 1}
          </span>
        ) : (
          <span className="text-slate-500">-</span>
        )}
      </div>

      {/* Created */}
      <div className="col-span-2 text-sm text-slate-400">
        {new Date(status.createdAt).toLocaleDateString()}
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-2">
        <button
          onClick={() => onEdit(status)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Edit"
        >
          <MuiIcons.Edit style={{ fontSize: 18 }} />
        </button>
        {!status.isDefault && (
          <button
            onClick={() => onDelete(status)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
            title="Delete"
          >
            <MuiIcons.Delete style={{ fontSize: 18 }} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Manage Statuses Page
 *
 * Features:
 * - View all task statuses in a draggable list
 * - Create new statuses with color and icon
 * - Edit existing statuses
 * - Delete non-default statuses
 * - Reorder workflow with drag-drop
 * - Visual workflow representation
 */
export function ManageStatuses() {
  const { data: workflowData, isLoading } = useStatusWorkflow();
  const deleteStatus = useDeleteStatus();
  const reorderStatuses = useReorderStatuses();
  const { openModal, setSelectedStatus } = useUIStore();

  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get statuses organized by workflow
  const { mainWorkflow, breakouts } = useMemo(() => {
    if (!workflowData?.data) {
      return { mainWorkflow: [], breakouts: [] };
    }
    return {
      mainWorkflow: workflowData.data.mainWorkflow || [],
      breakouts: workflowData.data.breakouts || [],
    };
  }, [workflowData]);

  // Group breakouts by parent
  const breakoutsByParent = useMemo(() => {
    const grouped: Record<string, TaskStatusEntity[]> = {};
    breakouts.forEach((b) => {
      if (b.breakoutParentId) {
        if (!grouped[b.breakoutParentId]) {
          grouped[b.breakoutParentId] = [];
        }
        grouped[b.breakoutParentId].push(b);
      }
    });
    return grouped;
  }, [breakouts]);

  // Flatten for rendering with breakouts after their parents
  const sortedStatuses = useMemo(() => {
    const result: { status: TaskStatusEntity; isBreakout: boolean }[] = [];
    mainWorkflow.forEach((status) => {
      result.push({ status, isBreakout: false });
      // Add breakouts after parent
      if (breakoutsByParent[status.id]) {
        breakoutsByParent[status.id].forEach((breakout) => {
          result.push({ status: breakout, isBreakout: true });
        });
      }
    });
    return result;
  }, [mainWorkflow, breakoutsByParent]);

  // Active status for drag overlay
  const activeStatus = useMemo(() => {
    if (!activeId) return null;
    return sortedStatuses.find((s) => s.status.id === activeId)?.status || null;
  }, [activeId, sortedStatuses]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      // Find indices
      const oldIndex = mainWorkflow.findIndex((s) => s.id === active.id);
      const newIndex = mainWorkflow.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder
      const reordered = arrayMove(mainWorkflow, oldIndex, newIndex);
      const order = reordered.map((s, i) => ({
        id: s.id,
        sortOrder: i,
        workflowOrder: i,
      }));

      try {
        await reorderStatuses.mutateAsync(order);
        toast.success('Workflow order updated');
      } catch (error) {
        toast.error('Failed to update order');
      }
    },
    [mainWorkflow, reorderStatuses]
  );

  // Handle edit
  const handleEdit = (status: TaskStatusEntity) => {
    setSelectedStatus(status);
    openModal('status-form');
  };

  // Handle delete with confirmation
  const handleDelete = (status: TaskStatusEntity) => {
    openModal('confirm-delete', {
      title: 'Delete Status',
      message: `Are you sure you want to delete "${status.name}"? Tasks using this status will need to be updated.`,
      onConfirm: async () => {
        try {
          await deleteStatus.mutateAsync(status.id);
          toast.success(`Deleted "${status.name}"`);
        } catch (error) {
          toast.error('Failed to delete status');
        }
      },
    });
  };

  // Handle add new
  const handleAdd = () => {
    setSelectedStatus(null);
    openModal('status-form');
  };

  return (
    <div className="p-6" data-testid="manage-statuses-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <MuiIcons.Label style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Statuses</h1>
            <p className="text-sm text-slate-400">
              {mainWorkflow.length} workflow statuses, {breakouts.length} breakouts
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Status
        </button>
      </div>

      {/* Workflow visualization */}
      <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
          <MuiIcons.Timeline style={{ fontSize: 18 }} />
          Workflow Order
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {mainWorkflow.map((status, i) => (
            <div key={status.id} className="flex items-center gap-2">
              <div
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white flex items-center gap-2"
                style={{ backgroundColor: status.color }}
              >
                {status.name}
                {breakoutsByParent[status.id] && (
                  <span className="text-xs opacity-75">
                    (+{breakoutsByParent[status.id].length})
                  </span>
                )}
              </div>
              {i < mainWorkflow.length - 1 && (
                <MuiIcons.ArrowForward className="text-slate-500" style={{ fontSize: 16 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-1" />
          <div className="col-span-4">Status</div>
          <div className="col-span-2">Color</div>
          <div className="col-span-2">Workflow Step</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
            Loading statuses...
          </div>
        ) : sortedStatuses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MuiIcons.LabelOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
            <p>No statuses found</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-violet-400 hover:text-violet-300 font-medium"
            >
              Create your first status
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mainWorkflow.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-slate-700/50">
                {sortedStatuses.map(({ status, isBreakout }) => (
                  <StatusRow
                    key={status.id}
                    status={status}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isBreakout={isBreakout}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeStatus && (
                <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center bg-slate-700 rounded-lg shadow-xl">
                  <div className="col-span-1 flex justify-center">
                    <MuiIcons.DragIndicator className="text-slate-400" style={{ fontSize: 20 }} />
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${activeStatus.color}20` }}
                    >
                      <MuiIcons.Label style={{ color: activeStatus.color, fontSize: 18 }} />
                    </div>
                    <span className="text-white font-medium">{activeStatus.name}</span>
                  </div>
                  <div className="col-span-2">
                    <div
                      className="w-6 h-6 rounded-md"
                      style={{ backgroundColor: activeStatus.color }}
                    />
                  </div>
                  <div className="col-span-5" />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default ManageStatuses;
