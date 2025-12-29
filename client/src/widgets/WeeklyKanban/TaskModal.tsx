import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useUpdateTask, useDeleteTask, useProjects } from '../../api';
import type { Task } from '../../types';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [plannedDate, setPlannedDate] = useState(task.plannedDate || '');
  const [priority, setPriority] = useState(task.priority || 0);
  const [projectId, setProjectId] = useState(task.projectId || '');

  const titleRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    updateTask.mutate(
      {
        id: task.id,
        title: title.trim(),
        description: description.trim() || undefined,
        plannedDate: plannedDate || undefined,
        priority: priority || undefined,
        projectId: projectId || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(task.id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

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
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white font-condensed">
            Edit Task
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
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Date and Priority row */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Task metadata */}
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Delete
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || updateTask.isPending}
                className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {updateTask.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
