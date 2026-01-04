import { useRef, useState, useEffect } from 'react';
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
} from '../../api';
import type { Category, Habit } from '../../types';

interface HabitFormData {
  name: string;
  categoryId: string;
  parentHabitId: string;
  icon: string;
  iconColor: string;
  isActive: boolean;
  targetPercentage: string;
  warningPercentage: string;
  grayMissedWhenOnTrack: boolean;
}

export function HabitForm() {
  const { closeModal, selectedHabit, setSelectedHabit, openIconPicker } = useUIStore();
  const isEditMode = !!selectedHabit;

  // API hooks
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const { data: categoriesData } = useCategories();
  const { data: habitsData } = useHabits();

  const categories: Category[] = categoriesData?.data || [];
  const potentialParents: Habit[] = (habitsData?.data || []).filter(h => {
    if (selectedHabit && h.id === selectedHabit.id) return false;
    if (h.parentHabitId) return false;
    if (selectedHabit && h.parentHabitId === selectedHabit.id) return false;
    return true;
  });

  // Icon/image preview state - can be icon code, data URL, or external URL
  const [selectedIconOrImage, setSelectedIconOrImage] = useState<string | null>(
    selectedHabit?.imageUrl || selectedHabit?.icon || null
  );

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
      targetPercentage: selectedHabit?.targetPercentage?.toString() || '90',
      warningPercentage: selectedHabit?.warningPercentage?.toString() || '75',
      grayMissedWhenOnTrack: selectedHabit?.grayMissedWhenOnTrack ?? false,
    },
  });

  const watchedIconColor = watch('iconColor');
  const watchedTargetPercentage = watch('targetPercentage');
  const watchedWarningPercentage = watch('warningPercentage');

  const percentageToDays = (pct: string): number => {
    const num = parseInt(pct, 10);
    if (isNaN(num)) return 0;
    return Math.round((num / 100) * 30);
  };

  const daysToPercentage = (days: number): number => {
    return Math.round((days / 30) * 100);
  };

  // Sync selectedIconOrImage when selectedHabit changes (for edit mode)
  useEffect(() => {
    if (selectedHabit) {
      const iconOrImage = selectedHabit.imageUrl || selectedHabit.icon || null;
      setSelectedIconOrImage(iconOrImage);
    }
  }, [selectedHabit]);

  // Helper to determine if value is an image URL/data URL vs icon code
  const isImageValue = (value: string | null) => {
    if (!value) return false;
    return value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://');
  };

  // Icon/image picker handler
  const handleIconSelect = (iconOrImage: string, color: string) => {
    setSelectedIconOrImage(iconOrImage);
    if (isImageValue(iconOrImage)) {
      setValue('icon', '');
      setValue('iconColor', '');
    } else {
      setValue('icon', iconOrImage);
      setValue('iconColor', color);
    }
  };

  const handleOpenIconPicker = () => {
    openIconPicker(handleIconSelect);
  };

  const handleClearSelection = () => {
    setSelectedIconOrImage(null);
    setValue('icon', '');
    setValue('iconColor', '#14b8a6');
  };

  const onSubmit = async (data: HabitFormData) => {
    try {
      const targetPercentage = data.targetPercentage ? parseInt(data.targetPercentage, 10) : 90;
      const warningPercentage = data.warningPercentage ? parseInt(data.warningPercentage, 10) : 75;

      // Determine if we have an image URL to save
      const imageUrl = selectedIconOrImage && isImageValue(selectedIconOrImage)
        ? selectedIconOrImage
        : undefined;

      if (isEditMode && selectedHabit) {
        await updateHabit.mutateAsync({
          id: selectedHabit.id,
          name: data.name,
          categoryId: data.categoryId || undefined,
          parentHabitId: data.parentHabitId || undefined,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          isActive: data.isActive,
          targetPercentage,
          warningPercentage,
          grayMissedWhenOnTrack: data.grayMissedWhenOnTrack,
          imageUrl: imageUrl,
        });
        toast.success('Habit updated successfully');
      } else {
        await createHabit.mutateAsync({
          name: data.name,
          categoryId: data.categoryId || undefined,
          parentHabitId: data.parentHabitId || undefined,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          isActive: data.isActive,
          targetPercentage,
          warningPercentage,
          grayMissedWhenOnTrack: data.grayMissedWhenOnTrack,
          imageUrl: imageUrl,
        });
        toast.success('Habit created successfully');
      }

      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save habit');
    }
  };

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

  const handleClose = () => {
    setSelectedHabit(null);
    closeModal();
  };

  const renderPreview = () => {
    // If we have an image (data URL or external URL)
    if (selectedIconOrImage && isImageValue(selectedIconOrImage)) {
      return (
        <img
          src={selectedIconOrImage}
          alt="Selected"
          className="w-10 h-10 rounded-lg object-cover border border-slate-600"
        />
      );
    }

    // If we have an icon code
    if (selectedIconOrImage) {
      if (selectedIconOrImage.startsWith('material:')) {
        const iconName = selectedIconOrImage.replace('material:', '');
        const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
        if (IconComponent) {
          return (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${watchedIconColor}20` }}
            >
              <IconComponent style={{ color: watchedIconColor || '#14b8a6', fontSize: 22 }} />
            </div>
          );
        }
      }

      return (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${watchedIconColor}20` }}
        >
          <i className={selectedIconOrImage} style={{ color: watchedIconColor || '#14b8a6', fontSize: 20 }} aria-hidden="true" />
        </div>
      );
    }

    // No selection - show placeholder
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
        <MuiIcons.Add style={{ color: '#64748b', fontSize: 20 }} />
      </div>
    );
  };

  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget &&
        modalContentRef.current &&
        !modalContentRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2"
      onClick={handleBackdropClick}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      <div
        ref={modalContentRef}
        className="bg-slate-800 rounded-xl w-full max-w-3xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        data-testid="habit-form"
      >
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <MuiIcons.CheckCircle style={{ color: 'white', fontSize: 18 }} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {isEditMode ? 'Edit Habit' : 'Create Habit'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <MuiIcons.Close style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Form - Two Column Layout */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 grid md:grid-cols-2 gap-4">
            {/* Left Column - Basic Info */}
            <div className="space-y-3">
              {/* Name field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Habit Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Habit name is required' })}
                  placeholder="e.g., Morning Exercise"
                  className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-slate-600'}`}
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Category & Parent in row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    {...register('categoryId')}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Parent Habit</label>
                  <select
                    {...register('parentHabitId')}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">None (standalone)</option>
                    {potentialParents.map((habit) => (
                      <option key={habit.id} value={habit.id}>{habit.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scoring Thresholds - Compact */}
              <div className="p-3 bg-slate-700/30 rounded-lg space-y-2">
                <div className="text-xs font-medium text-slate-300">Scoring Thresholds</div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-14">Target:</span>
                  <input
                    type="number"
                    {...register('targetPercentage')}
                    min={1} max={100}
                    className="w-14 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-center text-xs"
                  />
                  <span className="text-slate-500">%</span>
                  <span className="text-slate-600">=</span>
                  <input
                    type="number"
                    value={percentageToDays(watchedTargetPercentage)}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      if (!isNaN(days) && days >= 0 && days <= 30) {
                        setValue('targetPercentage', daysToPercentage(days).toString());
                      }
                    }}
                    min={1} max={30}
                    className="w-12 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-center text-xs"
                  />
                  <span className="text-slate-500 text-xs">d/mo</span>
                  <span className="text-emerald-400 text-xs">= Green</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-14">Warning:</span>
                  <input
                    type="number"
                    {...register('warningPercentage')}
                    min={1} max={100}
                    className="w-14 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-center text-xs"
                  />
                  <span className="text-slate-500">%</span>
                  <span className="text-slate-600">=</span>
                  <input
                    type="number"
                    value={percentageToDays(watchedWarningPercentage)}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      if (!isNaN(days) && days >= 0 && days <= 30) {
                        setValue('warningPercentage', daysToPercentage(days).toString());
                      }
                    }}
                    min={1} max={30}
                    className="w-12 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-center text-xs"
                  />
                  <span className="text-slate-500 text-xs">d/mo</span>
                  <span className="text-yellow-400 text-xs">= Yellow</span>
                </div>
              </div>

              {/* Low Frequency Toggle - Compact */}
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="text-white text-sm">Low frequency habit</div>
                  <div className="text-xs text-slate-400">Show gray instead of pink/red</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('grayMissedWhenOnTrack')} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
                </label>
              </div>
            </div>

            {/* Right Column - Visual & Settings */}
            <div className="space-y-3">
              {/* Icon/Image section - Unified Choose Icon button */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Icon or Image</label>
                <div className="flex items-center gap-2">
                  {/* Preview */}
                  {selectedIconOrImage && (
                    <div data-testid="selected-icon-preview">
                      {renderPreview()}
                    </div>
                  )}

                  {/* Choose Icon button */}
                  <button
                    type="button"
                    onClick={handleOpenIconPicker}
                    data-testid="choose-icon-button"
                    className="flex-1 flex items-center gap-3 p-2 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 transition-all text-left"
                  >
                    {!selectedIconOrImage && renderPreview()}
                    <div className="flex-1">
                      <div className="text-white text-sm">
                        {selectedIconOrImage ? 'Change Icon' : 'Choose Icon'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {selectedIconOrImage ? 'Select different icon or image' : 'Select icon, upload image, or enter URL'}
                      </div>
                    </div>
                    <MuiIcons.ChevronRight className="text-slate-400" style={{ fontSize: 20 }} />
                  </button>

                  {/* Clear button */}
                  {selectedIconOrImage && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      data-testid="clear-icon-button"
                      className="p-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                      title="Clear selection"
                    >
                      <MuiIcons.Close style={{ fontSize: 18 }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Active toggle - Compact */}
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="text-white text-sm">Active</div>
                  <div className="text-xs text-slate-400">Inactive habits are hidden from tracking</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
                </label>
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteHabit.isPending}
                className="px-3 py-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 text-sm font-medium flex items-center gap-1.5"
              >
                <MuiIcons.DeleteOutline style={{ fontSize: 16 }} />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createHabit.isPending || updateHabit.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                  isSubmitting || createHabit.isPending || updateHabit.isPending
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400'
                }`}
              >
                {(isSubmitting || createHabit.isPending || updateHabit.isPending) && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HabitForm;
