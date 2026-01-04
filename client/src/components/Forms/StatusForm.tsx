import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
  useStatuses,
} from '../../api';

interface StatusFormData {
  name: string;
  color: string;
  icon: string;
  isBreakout: boolean;
  breakoutParentId: string;
  isDefault: boolean;
  isInitialStatus: boolean;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#22c55e', // Green
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#64748b', // Slate
];

export function StatusForm() {
  const { closeModal, selectedStatus, setSelectedStatus, openIconPicker } = useUIStore();
  const isEditMode = !!selectedStatus;

  // Fetch statuses for parent selection
  const { data: statusesData } = useStatuses();
  const mainWorkflowStatuses = useMemo(() => {
    if (!statusesData?.data) return [];
    return statusesData.data.filter(s => !s.isDeleted && !s.isBreakout);
  }, [statusesData]);

  // API hooks
  const createStatus = useCreateStatus();
  const updateStatus = useUpdateStatus();
  const deleteStatus = useDeleteStatus();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StatusFormData>({
    defaultValues: {
      name: selectedStatus?.name || '',
      color: selectedStatus?.color || '#3b82f6',
      icon: selectedStatus?.icon || '',
      isBreakout: selectedStatus?.isBreakout || false,
      breakoutParentId: selectedStatus?.breakoutParentId || '',
      isDefault: selectedStatus?.isDefault || false,
      isInitialStatus: selectedStatus?.isInitialStatus || false,
    },
  });

  const watchedColor = watch('color');
  const watchedIcon = watch('icon');
  const watchedIsBreakout = watch('isBreakout');

  // Icon picker handler
  const handleIconSelect = (icon: string, color: string) => {
    setValue('icon', icon);
    setValue('color', color);
  };

  // Open icon picker
  const handleOpenIconPicker = () => {
    openIconPicker(handleIconSelect);
  };

  // Handle form submission
  const onSubmit = async (data: StatusFormData) => {
    try {
      if (isEditMode && selectedStatus) {
        await updateStatus.mutateAsync({
          id: selectedStatus.id,
          name: data.name,
          color: data.color,
          icon: data.icon || undefined,
          isBreakout: data.isBreakout,
          breakoutParentId: data.isBreakout ? data.breakoutParentId : undefined,
          isDefault: data.isDefault,
          isInitialStatus: data.isInitialStatus,
        });
        toast.success('Status updated successfully');
      } else {
        await createStatus.mutateAsync({
          name: data.name,
          color: data.color,
          icon: data.icon || undefined,
          isBreakout: data.isBreakout,
          breakoutParentId: data.isBreakout ? data.breakoutParentId : undefined,
          isDefault: data.isDefault,
          isInitialStatus: data.isInitialStatus,
        });
        toast.success('Status created successfully');
      }
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedStatus) return;

    try {
      await deleteStatus.mutateAsync(selectedStatus.id);
      toast.success('Status deleted');
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete status');
    }
  };

  // Close and cleanup
  const handleClose = () => {
    setSelectedStatus(null);
    closeModal();
  };

  // Render icon preview
  const renderIconPreview = () => {
    if (!watchedIcon) {
      return (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${watchedColor}20` }}
        >
          <MuiIcons.Label style={{ color: watchedColor, fontSize: 24 }} />
        </div>
      );
    }

    // Handle Material icons
    if (watchedIcon.startsWith('material:')) {
      const iconName = watchedIcon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${watchedColor}20` }}
          >
            <IconComponent style={{ color: watchedColor, fontSize: 28 }} />
          </div>
        );
      }
    }

    // Handle Font Awesome icons
    return (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${watchedColor}20` }}
      >
        <i
          className={watchedIcon}
          style={{ color: watchedColor, fontSize: 24 }}
          aria-hidden="true"
        />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${watchedColor}, ${watchedColor}cc)` }}
              >
                <MuiIcons.Label style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Edit Status' : 'Create Status'}
                </h2>
                <p className="text-sm text-slate-400">
                  {isEditMode ? 'Update status details' : 'Add a workflow status'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Status name is required' })}
                placeholder="e.g., In Progress, Blocked, Review"
                className={`
                  w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition-all
                  ${errors.name ? 'border-red-500' : 'border-slate-600'}
                `}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <MuiIcons.ErrorOutline style={{ fontSize: 16 }} />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`
                      w-8 h-8 rounded-lg transition-all duration-150
                      ${watchedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('color')}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={watchedColor}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Icon
              </label>
              <button
                type="button"
                onClick={handleOpenIconPicker}
                className="w-full flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all group"
              >
                {renderIconPreview()}
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">
                    {watchedIcon ? 'Change Icon' : 'Choose an Icon'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {watchedIcon ? 'Click to select a different icon' : 'Select an icon for this status'}
                  </div>
                </div>
                <MuiIcons.ChevronRight
                  className="text-slate-400 group-hover:text-white transition-colors"
                  style={{ fontSize: 24 }}
                />
              </button>
            </div>

            {/* Breakout toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isBreakout')}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                <div>
                  <span className="text-white font-medium">Breakout Status</span>
                  <p className="text-sm text-slate-400">Side status that branches off main workflow</p>
                </div>
              </label>
            </div>

            {/* Parent status selector (for breakouts) */}
            {watchedIsBreakout && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Parent Status
                </label>
                <select
                  {...register('breakoutParentId')}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select parent status...</option>
                  {mainWorkflowStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-sm text-slate-400">
                  Tasks can branch to this status from the parent
                </p>
              </div>
            )}

            {/* Default and Initial status toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isInitialStatus')}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                <div>
                  <span className="text-white font-medium">Initial Status</span>
                  <p className="text-sm text-slate-400">New tasks start in this status</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isDefault')}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                <div>
                  <span className="text-white font-medium">Default Status</span>
                  <p className="text-sm text-slate-400">System-provided status (cannot be deleted)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            {/* Delete button (edit mode only, non-default) */}
            {isEditMode && !selectedStatus?.isDefault ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteStatus.isPending}
                className="px-4 py-2.5 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors font-medium flex items-center gap-2"
              >
                <MuiIcons.DeleteOutline style={{ fontSize: 18 }} />
                Delete
              </button>
            ) : (
              <div /> // Spacer
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createStatus.isPending || updateStatus.isPending}
                className={`
                  px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                  flex items-center gap-2
                  ${isSubmitting || createStatus.isPending || updateStatus.isPending
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/25'
                  }
                `}
              >
                {(isSubmitting || createStatus.isPending || updateStatus.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create Status'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StatusForm;
