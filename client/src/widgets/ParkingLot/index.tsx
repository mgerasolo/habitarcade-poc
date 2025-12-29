import {
  useParkingLot,
  useCreateParkingLotItem,
  useDeleteParkingLotItem,
  useConvertParkingLotToTask,
} from '../../api';
import { QuickInput } from './QuickInput';
import { CapturedItem } from './CapturedItem';
import type { ParkingLotItem } from '../../types';

interface ParkingLotProps {
  /** Custom class name */
  className?: string;
}

/**
 * ParkingLot - Quick capture widget for brain dumps
 *
 * Features:
 * - Quick capture input at top (type + enter = instant save)
 * - List of captured items below, newest first
 * - Click X to delete (soft delete, no confirmation)
 * - Drag item to calendar to schedule as task
 * - Simple, minimal UI
 */
export function ParkingLot({ className = '' }: ParkingLotProps) {
  const { data: items, isLoading, isError } = useParkingLot();
  const createItem = useCreateParkingLotItem();
  const deleteItem = useDeleteParkingLotItem();
  const convertToTask = useConvertParkingLotToTask();

  const handleCapture = (content: string) => {
    createItem.mutate({ content });
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id);
  };

  const handleConvertToTask = (id: string, plannedDate?: string) => {
    convertToTask.mutate({ id, plannedDate });
  };

  // Sort items by createdAt, newest first
  const sortedItems = [...(items?.data || [])].sort(
    (a: ParkingLotItem, b: ParkingLotItem) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <ErrorState />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Quick capture input */}
      <QuickInput onCapture={handleCapture} isLoading={createItem.isPending} />

      {/* Items list */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {sortedItems.map((item: ParkingLotItem) => (
          <CapturedItem
            key={item.id}
            item={item}
            onDelete={() => handleDelete(item.id)}
            onConvertToTask={(plannedDate) =>
              handleConvertToTask(item.id, plannedDate)
            }
            isDeleting={deleteItem.isPending && deleteItem.variables === item.id}
            isConverting={
              convertToTask.isPending && convertToTask.variables?.id === item.id
            }
          />
        ))}

        {/* Empty state */}
        {sortedItems.length === 0 && <EmptyState />}
      </div>

      {/* Item count */}
      {sortedItems.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/30">
          <span className="text-[10px] text-slate-500">
            {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} in
            parking lot
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Input skeleton */}
      <div className="h-10 bg-slate-700/30 rounded-lg mb-3" />

      {/* Item skeletons */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 bg-slate-700/30 rounded-lg"
            style={{ opacity: 1 - i * 0.25 }}
          />
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
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="text-red-400 mb-2">
        <svg
          className="w-10 h-10 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-400">Failed to load parking lot</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-xs text-teal-400 hover:text-teal-300"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
      <div className="text-slate-600 mb-3">
        <svg
          className="w-12 h-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-500 font-medium">Brain dump here</p>
      <p className="text-xs text-slate-600 mt-1">Process later</p>
    </div>
  );
}

export default ParkingLot;
