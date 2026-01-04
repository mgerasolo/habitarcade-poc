import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCategories,
  useHabits,
  useUploadHabitImage,
  useDeleteHabitImage,
} from '../../api';
import type { Category, Habit } from '../../types';

interface HabitFormData {
  name: string;
  categoryId: string;
  parentHabitId: string; // For parent/child habit relationships (#61)
  icon: string;
  iconColor: string;
  isActive: boolean;
  dailyTarget: string; // String for form input, convert to number on submit
}

export function HabitForm() {
  const { closeModal, selectedHabit, setSelectedHabit, openIconPicker } = useUIStore();
  const isEditMode = !!selectedHabit;

  // API hooks
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const uploadImage = useUploadHabitImage();
  const deleteImage = useDeleteHabitImage();
  const { data: categoriesData } = useCategories();
  const { data: habitsData } = useHabits();

  const categories: Category[] = categoriesData?.data || [];
  // Filter habits to only show potential parents (not the current habit, not children of current habit)
  const potentialParents: Habit[] = (habitsData?.data || []).filter(h => {
    // Don't include the current habit itself
    if (selectedHabit && h.id === selectedHabit.id) return false;
    // Don't include habits that are already children of another habit
    if (h.parentHabitId) return false;
    // Don't include habits that are children of the current habit (circular reference)
    if (selectedHabit && h.parentHabitId === selectedHabit.id) return false;
    return true;
  });

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    selectedHabit?.imageUrl || null
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormData>({
    defaultValues: {
      name: selectedHabit?.name || '',
      categoryId: selectedHabit?.categoryId || '',
      parentHabitId: selectedHabit?.parentHabitId || '',
      icon: selectedHabit?.icon || '',
      iconColor: selectedHabit?.iconColor || '#14b8a6',
      isActive: selectedHabit?.isActive ?? true,
      dailyTarget: selectedHabit?.dailyTarget?.toString() || '',
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

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPendingImageFile(file);

    // Clear icon selection when custom image is chosen
    setValue('icon', '');
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    if (isEditMode && selectedHabit?.imageUrl && !pendingImageFile) {
      // Delete existing image from server
      try {
        await deleteImage.mutateAsync(selectedHabit.id);
        toast.success('Image removed');
      } catch (error) {
        toast.error('Failed to remove image');
        return;
      }
    }
    setImagePreview(null);
    setPendingImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const onSubmit = async (data: HabitFormData) => {
    try {
      // Convert dailyTarget string to number or undefined
      const dailyTarget = data.dailyTarget ? parseInt(data.dailyTarget, 10) : undefined;

      let habitId: string;

      if (isEditMode && selectedHabit) {
        await updateHabit.mutateAsync({
          id: selectedHabit.id,
          name: data.name,
          categoryId: data.categoryId || undefined,
          parentHabitId: data.parentHabitId || undefined, // Parent/child relationship (#61)
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          isActive: data.isActive,
          dailyTarget: dailyTarget || undefined, // Send undefined to clear target
        });
        habitId = selectedHabit.id;
        toast.success('Habit updated successfully');
      } else {
        const result = await createHabit.mutateAsync({
          name: data.name,
          categoryId: data.categoryId || undefined,
          parentHabitId: data.parentHabitId || undefined, // Parent/child relationship (#61)
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          isActive: data.isActive,
          dailyTarget,
        });
        habitId = result.data.id;
        toast.success('Habit created successfully');
      }

      // Upload pending image if exists
      if (pendingImageFile) {
        try {
          await uploadImage.mutateAsync({ id: habitId, file: pendingImageFile });
        } catch (error) {
          toast.error('Habit saved but image upload failed');
        }
      }

      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save habit');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedHabit) return;

    try {
      await deleteHabit.mutateAsync(selectedHabit.id);
      toast.success('Habit deleted');
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete habit');
    }
  };

  // Close and cleanup
  const handleClose = () => {
    setSelectedHabit(null);
    closeModal();
  };

  // Render icon preview
  const renderIconPreview = () => {
    if (!watchedIcon) {
      return (
        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
          <MuiIcons.Add style={{ color: '#64748b', fontSize: 24 }} />
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
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <MuiIcons.CheckCircle style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Edit Habit' : 'Create Habit'}
                </h2>
                <p className="text-sm text-slate-400">
                  {isEditMode ? 'Update habit details' : 'Add a new habit to track'}
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
                Habit Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Habit name is required' })}
                placeholder="e.g., Morning Exercise"
                className={`
                  w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
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

            {/* Category select */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                {...register('categoryId')}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Group habits by category for better organization
              </p>
            </div>

            {/* Parent Habit select (#61) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Parent Habit
              </label>
              <select
                {...register('parentHabitId')}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">No parent (standalone habit)</option>
                {potentialParents.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Make this a child of another habit. Parent habits roll up child status automatically.
              </p>
            </div>

            {/* Daily Target (count-based habit) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Daily Target (Count-Based)
              </label>
              <input
                type="number"
                {...register('dailyTarget', {
                  min: { value: 0, message: 'Target must be 0 or greater' },
                  max: { value: 99, message: 'Target must be 99 or less' },
                })}
                placeholder="e.g., 3 for 3x daily"
                min={0}
                max={99}
                className={`
                  w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                  focus:border-transparent transition-all
                  ${errors.dailyTarget ? 'border-red-500' : 'border-slate-600'}
                `}
              />
              {errors.dailyTarget && (
                <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                  <MuiIcons.ErrorOutline style={{ fontSize: 16 }} />
                  {errors.dailyTarget.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-500">
                Set a count target for habits done multiple times daily (e.g., supplements 3x/day). Leave empty for standard yes/no habits.
              </p>
            </div>

            {/* Custom Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleImageSelect}
                className="hidden"
              />
              {imagePreview ? (
                <div className="flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-xl">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                    <img
                      src={imagePreview}
                      alt="Custom habit icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Custom Image</div>
                    <div className="text-sm text-slate-400">
                      {pendingImageFile ? 'Ready to upload' : 'Uploaded image'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors"
                    title="Remove image"
                  >
                    <MuiIcons.Close style={{ fontSize: 20 }} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                    <MuiIcons.CloudUpload style={{ color: '#64748b', fontSize: 24 }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">Upload Image</div>
                    <div className="text-sm text-slate-400">
                      JPEG, PNG, GIF, WebP, or SVG (max 5MB)
                    </div>
                  </div>
                  <MuiIcons.ChevronRight
                    className="text-slate-400 group-hover:text-white transition-colors"
                    style={{ fontSize: 24 }}
                  />
                </button>
              )}
            </div>

            {/* Icon picker (only show if no custom image) */}
            {!imagePreview && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Or Choose an Icon
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
                      {watchedIcon ? 'Click to select a different icon' : 'Select from icon library'}
                    </div>
                  </div>
                  <MuiIcons.ChevronRight
                    className="text-slate-400 group-hover:text-white transition-colors"
                    style={{ fontSize: 24 }}
                  />
                </button>
              </div>
            )}

            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
              <div>
                <div className="text-white font-medium">Active</div>
                <div className="text-sm text-slate-400">
                  Inactive habits are hidden from daily tracking
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500" />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            {/* Delete button (edit mode only) */}
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteHabit.isPending}
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
                disabled={isSubmitting || createHabit.isPending || updateHabit.isPending}
                className={`
                  px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                  flex items-center gap-2
                  ${isSubmitting || createHabit.isPending || updateHabit.isPending
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 shadow-lg shadow-teal-600/25'
                  }
                `}
              >
                {(isSubmitting || createHabit.isPending || updateHabit.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HabitForm;
