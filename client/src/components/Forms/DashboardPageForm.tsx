import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore, useDashboardStore } from '../../stores';
import type { DashboardPage } from '../../types';

interface DashboardPageFormData {
  name: string;
  icon: string;
  iconColor: string;
}

export function DashboardPageForm() {
  const { closeModal, modalData, openIconPicker } = useUIStore();
  const { updatePage, deletePage, pages } = useDashboardStore();

  // Get the page to edit from modalData
  const pageId = modalData as string | undefined;
  const page = pageId ? pages.find(p => p.id === pageId) : undefined;
  const isDefault = page?.isDefault ?? false;

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DashboardPageFormData>({
    defaultValues: {
      name: page?.name || '',
      icon: page?.icon || 'Dashboard',
      iconColor: page?.iconColor || '#6366f1',
    },
  });

  const watchedIcon = watch('icon');
  const watchedIconColor = watch('iconColor');

  // Sync form values when page changes
  useEffect(() => {
    if (page) {
      setValue('name', page.name);
      setValue('icon', page.icon || 'Dashboard');
      setValue('iconColor', page.iconColor || '#6366f1');
    }
  }, [page, setValue]);

  // Icon picker handler
  const handleIconSelect = (icon: string, color: string) => {
    setValue('icon', icon);
    setValue('iconColor', color);
  };

  // Open icon picker
  const handleOpenIconPicker = () => {
    openIconPicker(handleIconSelect);
  };

  // Clear selected icon
  const handleClearSelection = () => {
    setValue('icon', 'Dashboard');
    setValue('iconColor', '#6366f1');
  };

  // Handle form submission
  const onSubmit = async (data: DashboardPageFormData) => {
    if (!pageId) return;

    try {
      updatePage(pageId, {
        name: data.name,
        icon: data.icon,
        iconColor: data.iconColor,
      });
      toast.success('Dashboard page updated');
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update page');
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!pageId || isDefault) return;

    deletePage(pageId);
    toast.success('Dashboard page deleted');
    closeModal();
  };

  // Render icon preview
  const renderIconPreview = () => {
    if (!watchedIcon) {
      return (
        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
          <MuiIcons.Dashboard style={{ color: '#64748b', fontSize: 24 }} />
        </div>
      );
    }

    // Handle Material icons (check if it's a key of MuiIcons)
    if (watchedIcon.startsWith('material:')) {
      const iconName = watchedIcon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${watchedIconColor}20` }}
          >
            <IconComponent style={{ color: watchedIconColor, fontSize: 28 }} />
          </div>
        );
      }
    }

    // Check if it's a direct MuiIcon name
    const DirectIconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[watchedIcon];
    if (DirectIconComponent) {
      return (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${watchedIconColor}20` }}
        >
          <DirectIconComponent style={{ color: watchedIconColor, fontSize: 28 }} />
        </div>
      );
    }

    // Handle Font Awesome icons
    return (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${watchedIconColor}20` }}
      >
        <i
          className={watchedIcon}
          style={{ color: watchedIconColor, fontSize: 24 }}
          aria-hidden="true"
        />
      </div>
    );
  };

  if (!page) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="dashboard-page-form"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <MuiIcons.Dashboard style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Edit Dashboard Page
                </h2>
                <p className="text-sm text-slate-400">
                  Customize page name and icon
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-5">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Page Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Page name is required' })}
                placeholder="e.g., Work Dashboard"
                data-testid="page-name-input"
                className={`
                  w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
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

            {/* Icon picker */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Icon & Color
              </label>
              <div className="flex items-center gap-3">
                {/* Preview */}
                {watchedIcon && (
                  <div data-testid="selected-icon-preview">
                    {renderIconPreview()}
                  </div>
                )}

                {/* Choose Icon button */}
                <button
                  type="button"
                  onClick={handleOpenIconPicker}
                  data-testid="choose-icon-button"
                  className="flex-1 flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all group"
                >
                  {!watchedIcon && renderIconPreview()}
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">
                      {watchedIcon ? 'Change Icon' : 'Choose Icon'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {watchedIcon ? 'Click to select a different icon' : 'Select icon, upload image, or enter URL'}
                    </div>
                  </div>
                  <MuiIcons.ChevronRight
                    className="text-slate-400 group-hover:text-white transition-colors"
                    style={{ fontSize: 24 }}
                  />
                </button>

                {/* Clear button */}
                {watchedIcon && watchedIcon !== 'Dashboard' && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    data-testid="clear-icon-button"
                    className="p-3 rounded-xl bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                    title="Reset to default"
                  >
                    <MuiIcons.Close style={{ fontSize: 20 }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            {/* Delete button (not for default page) */}
            {!isDefault ? (
              <button
                type="button"
                onClick={handleDelete}
                data-testid="delete-page-button"
                className="px-4 py-2.5 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors font-medium flex items-center gap-2"
              >
                <MuiIcons.DeleteOutline style={{ fontSize: 18 }} />
                Delete Page
              </button>
            ) : (
              <div className="text-sm text-slate-500 flex items-center gap-1">
                <MuiIcons.Lock style={{ fontSize: 14 }} />
                Default page cannot be deleted
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                  flex items-center gap-2
                  ${isSubmitting
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/25'
                  }
                `}
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DashboardPageForm;
