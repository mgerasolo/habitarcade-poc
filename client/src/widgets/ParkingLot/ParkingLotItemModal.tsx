import { useState, useEffect, useRef } from 'react';
import * as MuiIcons from '@mui/icons-material';
import {
  useUpdateParkingLotItem,
  useDeleteParkingLotItem,
  useConvertParkingLotToTask,
  useProjects,
} from '../../api';
import { useUIStore } from '../../stores';
import type { ParkingLotItem, Project } from '../../types';

interface ParkingLotItemModalData {
  item: ParkingLotItem;
  mode: 'edit' | 'details';
}

/**
 * ParkingLotItemModal - Edit or view details of a parking lot item
 *
 * Features:
 * - Edit content
 * - Convert to task with project/date selection
 * - Delete item
 * - View creation timestamp
 */
export function ParkingLotItemModal() {
  const { closeModal, modalData } = useUIStore();
  const data = modalData as ParkingLotItemModalData | undefined;

  const item = data?.item;
  const mode = data?.mode || 'details';

  const [content, setContent] = useState(item?.content || '');
  const [projectId, setProjectId] = useState('');
  const [plannedDate, setPlannedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const updateItem = useUpdateParkingLotItem();
  const deleteItem = useDeleteParkingLotItem();
  const convertToTask = useConvertParkingLotToTask();
  const { data: projectsData } = useProjects();

  const projects = (projectsData?.data || [])
    .filter((p: Project) => !p.isDeleted)
    .sort((a: Project, b: Project) => a.name.localeCompare(b.name));

  // Focus content on mount if editing
  useEffect(() => {
    if (mode === 'edit' && contentRef.current) {
      contentRef.current.focus();
      contentRef.current.select();
    }
  }, [mode]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  if (!item) return null;

  const handleSave = () => {
    if (!content.trim()) return;

    updateItem.mutate(
      { id: item.id, content: content.trim() },
      { onSuccess: () => closeModal() }
    );
  };

  const handleDelete = () => {
    deleteItem.mutate(item.id, { onSuccess: () => closeModal() });
  };

  const handleConvertToTask = () => {
    convertToTask.mutate(
      {
        id: item.id,
        projectId: projectId || undefined,
        plannedDate: plannedDate || undefined,
      },
      { onSuccess: () => closeModal() }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isLoading =
    updateItem.isPending || deleteItem.isPending || convertToTask.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        ref={modalRef}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-700/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              {mode === 'edit' ? (
                <MuiIcons.Edit style={{ color: 'white', fontSize: 20 }} />
              ) : (
                <MuiIcons.Info style={{ color: 'white', fontSize: 20 }} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {mode === 'edit' ? 'Edit Item' : 'Item Details'}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
          >
            <MuiIcons.Close style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Content field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content
            </label>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              disabled={mode === 'details'}
              className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none disabled:opacity-70 disabled:cursor-default"
              placeholder="What's on your mind?"
            />
          </div>

          {/* Convert to Task section */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <MuiIcons.TaskAlt style={{ fontSize: 18 }} />
              Convert to Task
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">No project</option>
                  {projects.map((project: Project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Planned Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Planned Date
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleConvertToTask}
              disabled={isLoading}
              className="mt-3 w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {convertToTask.isPending ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Converting...
                </>
              ) : (
                <>
                  <MuiIcons.ArrowForward style={{ fontSize: 18 }} />
                  Convert to Task
                </>
              )}
            </button>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-500">
              Created: {formatDate(item.createdAt)}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/50">
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <MuiIcons.Delete style={{ fontSize: 18 }} />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {mode === 'edit' && (
              <button
                onClick={handleSave}
                disabled={!content.trim() || isLoading}
                className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {updateItem.isPending ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParkingLotItemModal;
