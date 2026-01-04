import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../api';

interface CategoryFormData {
  name: string;
  icon: string;
  iconColor: string;
}

export function CategoryForm() {
  const { closeModal, selectedCategory, setSelectedCategory, openIconPicker } = useUIStore();
  const isEditMode = !!selectedCategory;

  // API hooks
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: selectedCategory?.name || '',
      icon: selectedCategory?.icon || '',
      iconColor: selectedCategory?.iconColor || '#3b82f6',
    },
  });

  const watchedIcon = watch('icon');
  const watchedIconColor = watch('iconColor');

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
    setValue('icon', '');
    setValue('iconColor', '#3b82f6');
  };

  // Handle form submission
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditMode && selectedCategory) {
        await updateCategory.mutateAsync({
          id: selectedCategory.id,
          name: data.name,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
        });
        toast.success('Category updated successfully');
      } else {
        await createCategory.mutateAsync({
          name: data.name,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
        });
        toast.success('Category created successfully');
      }
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      toast.success('Category deleted');
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  // Close and cleanup
  const handleClose = () => {
    setSelectedCategory(null);
    closeModal();
  };

  // Render icon preview
  const renderIconPreview = () => {
    if (!watchedIcon) {
      return (
        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
          <MuiIcons.Category style={{ color: '#64748b', fontSize: 24 }} />
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
            style={{ backgroundColor: `${watchedIconColor}20` }}
          >
            <IconComponent style={{ color: watchedIconColor, fontSize: 28 }} />
          </div>
        );
      }
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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="category-form"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <MuiIcons.Category style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Edit Category' : 'Create Category'}
                </h2>
                <p className="text-sm text-slate-400">
                  {isEditMode ? 'Update category details' : 'Organize your habits'}
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
          <div className="p-5 space-y-5">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Category name is required' })}
                placeholder="e.g., Health & Fitness"
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
                {watchedIcon && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    data-testid="clear-icon-button"
                    className="p-3 rounded-xl bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                    title="Clear selection"
                  >
                    <MuiIcons.Close style={{ fontSize: 20 }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            {/* Delete button (edit mode only) */}
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteCategory.isPending}
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
                disabled={isSubmitting || createCategory.isPending || updateCategory.isPending}
                className={`
                  px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                  flex items-center gap-2
                  ${isSubmitting || createCategory.isPending || updateCategory.isPending
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/25'
                  }
                `}
              >
                {(isSubmitting || createCategory.isPending || updateCategory.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryForm;
