import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useUpdateTask, useDeleteTask, useCreateTask, useProjects, useStatuses, useTasks } from '../../api';
import type { Task } from '../../types';

interface TaskModalProps {
  task?: Task; // Optional - if not provided, we're in create mode
  defaultStatusId?: string; // For creating tasks with a specific status
  onClose: () => void;
}

export function TaskModal({ task, defaultStatusId, onClose }: TaskModalProps) {
  const isCreateMode = !task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [plannedDate, setPlannedDate] = useState(task?.plannedDate || '');
  const [priority, setPriority] = useState(task?.priority || 0);
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [statusId, setStatusId] = useState(task?.statusId || defaultStatusId || '');
  const [parentTaskId, setParentTaskId] = useState(task?.parentTaskId || '');

  const titleRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const { data: statusesData } = useStatuses();
  const statuses = statusesData?.data?.filter(s => !s.isBreakout) || [];
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];
  const { data: tasksData } = useTasks();
  // Filter out the current task and any tasks that are already children (to avoid circular refs)
  const availableParentTasks = (tasksData?.data || []).filter(t =>
    !t.isDeleted &&
    t.id !== task?.id &&
    !t.parentTaskId // Only show top-level tasks as potential parents
  );

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();

    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      plannedDate: plannedDate || undefined,
      priority: priority || undefined,
      projectId: projectId || undefined,
      statusId: statusId || undefined,
      parentTaskId: parentTaskId || undefined,
    };

    if (isCreateMode) {
      createTask.mutate(
        {
          ...taskData,
          status: 'pending', // Legacy field
          sortOrder: 0,
        },
        {
          onSuccess: () => {
            if (addAnother) {
              // Reset only title and description, keep project/priority/status/date
              setTitle('');
              setDescription('');
              // Re-focus the title input
              setTimeout(() => {
                titleRef.current?.focus();
              }, 50);
            } else {
              onClose();
            }
          },
        }
      );
    } else {
      updateTask.mutate(
        {
          id: task.id,
          ...taskData,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  const handleCreateAndAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e as unknown as React.FormEvent, true);
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const isPending = isCreateMode ? createTask.isPending : updateTask.isPending;

  const priorityOptions = [
    { value: 0, label: 'None', color: 'text-slate-400' },
    { value: 1, label: 'Low', color: 'text-blue-400' },
    { value: 2, label: 'Medium', color: 'text-amber-400' },
    { value: 3, label: 'High', color: 'text-red-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md md:max-w-2xl mx-4 overflow-hidden border border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white font-condensed">
            {isCreateMode ? 'New Task' : 'Edit Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Two-column layout on desktop */}
          <div className="md:grid md:grid-cols-2 md:gap-6">
            {/* Left column - Title and Description */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Task title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Optional description..."
                />
              </div>

              {/* Parent Task (for subtasks) - on left column for desktop */}
              <div className="hidden md:block">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Parent Task <span className="text-slate-500 text-xs">(optional - makes this a subtask)</span>
                </label>
                <select
                  value={parentTaskId}
                  onChange={(e) => setParentTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">No parent (top-level task)</option>
                  {availableParentTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right column - Properties */}
            <div className="space-y-4 mt-4 md:mt-0">
              {/* Planned Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Planned Date
                </label>
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">No project</option>
                  {projects
                    .filter((p) => !p.isDeleted)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.icon ? `${project.icon} ` : ''}{project.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">No status</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parent Task - mobile only (shown below columns on mobile) */}
          <div className="md:hidden">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Parent Task <span className="text-slate-500 text-xs">(optional - makes this a subtask)</span>
            </label>
            <select
              value={parentTaskId}
              onChange={(e) => setParentTaskId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">No parent (top-level task)</option>
              {availableParentTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Task metadata - only in edit mode */}
          {!isCreateMode && task && (
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-700">
              <span>
                Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
              </span>
              {task.completedAt && (
                <span>
                  Completed: {format(new Date(task.completedAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {!isCreateMode ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Delete
              </button>
            ) : (
              <div /> /* Spacer */
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {isCreateMode && (
                <button
                  type="button"
                  onClick={handleCreateAndAddAnother}
                  disabled={!title.trim() || isPending}
                  className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isPending ? 'Saving...' : 'Create & Add'}
                </button>
              )}
              <button
                type="submit"
                disabled={!title.trim() || isPending}
                className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isPending ? 'Saving...' : isCreateMode ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
