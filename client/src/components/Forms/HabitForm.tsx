import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCategories,
} from '../../api';
import type { Category, HabitFrequency, HabitLink } from '../../types';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

interface HabitFormData {
  name: string;
  categoryId: string;
  icon: string;
  iconColor: string;
  description: string;
  goalTarget: number | null;
  goalFrequency: HabitFrequency | '';
  goalDays: string[];
  links: HabitLink[];
}

export function HabitForm() {
  const { closeModal, selectedHabit, setSelectedHabit, openIconPicker } = useUIStore();
  const isEditMode = !!selectedHabit;
  const [activeTab, setActiveTab] = useState<'basic' | 'goals' | 'links'>('basic');

  // API hooks
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const { data: categoriesData } = useCategories();

  const categories: Category[] = categoriesData?.data || [];

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormData>({
    defaultValues: {
      name: selectedHabit?.name || '',
      categoryId: selectedHabit?.categoryId || '',
      icon: selectedHabit?.icon || '',
      iconColor: selectedHabit?.iconColor || '#14b8a6',
      description: selectedHabit?.description || '',
      goalTarget: selectedHabit?.goalTarget || null,
      goalFrequency: selectedHabit?.goalFrequency || '',
      goalDays: selectedHabit?.goalDays || [],
      links: selectedHabit?.links || [],
    },
  });

  // Field array for links
  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: 'links',
  });

  const watchedIcon = watch('icon');
  const watchedIconColor = watch('iconColor');
  const watchedGoalFrequency = watch('goalFrequency');
  const watchedGoalDays = watch('goalDays');

  // Icon picker handler
  const handleIconSelect = (icon: string, color: string) => {
    setValue('icon', icon);
    setValue('iconColor', color);
  };

  // Open icon picker
  const handleOpenIconPicker = () => {
    openIconPicker(handleIconSelect);
  };

  // Toggle day selection
  const toggleDay = (dayId: string) => {
    const currentDays = watchedGoalDays || [];
    if (currentDays.includes(dayId)) {
      setValue('goalDays', currentDays.filter(d => d !== dayId));
    } else {
      setValue('goalDays', [...currentDays, dayId]);
    }
  };

  // Handle form submission
  const onSubmit = async (data: HabitFormData) => {
    try {
      const habitData = {
        name: data.name,
        categoryId: data.categoryId || undefined,
        icon: data.icon || undefined,
        iconColor: data.iconColor || undefined,
        description: data.description || undefined,
        goalTarget: data.goalTarget || undefined,
        goalFrequency: data.goalFrequency || undefined,
        goalDays: data.goalFrequency === 'specific_days' ? data.goalDays : undefined,
        links: data.links.length > 0 ? data.links : undefined,
      };

      if (isEditMode && selectedHabit) {
        await updateHabit.mutateAsync({
          id: selectedHabit.id,
          ...habitData,
        });
        toast.success('Habit updated successfully');
      } else {
        await createHabit.mutateAsync(habitData);
        toast.success('Habit created successfully');
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

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MuiIcons.Edit style={{ fontSize: 18 }} />
              Basic Info
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'goals'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MuiIcons.Flag style={{ fontSize: 18 }} />
              Goals
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'links'
                ? 'text-teal-400 border-b-2 border-teal-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MuiIcons.Link style={{ fontSize: 18 }} />
              Links
            </div>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-5 min-h-[300px]">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <>
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    placeholder="Optional notes about this habit..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  />
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
                </div>

                {/* Icon picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Icon & Color
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
                        {watchedIcon ? 'Click to select a different icon' : 'Select an icon for this habit'}
                      </div>
                    </div>
                    <MuiIcons.ChevronRight
                      className="text-slate-400 group-hover:text-white transition-colors"
                      style={{ fontSize: 24 }}
                    />
                  </button>
                </div>
              </>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <>
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Frequency
                  </label>
                  <select
                    {...register('goalFrequency')}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="">No frequency set</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="specific_days">Specific Days</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    How often do you want to complete this habit?
                  </p>
                </div>

                {/* Target count for weekly */}
                {watchedGoalFrequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target per Week
                    </label>
                    <input
                      type="number"
                      {...register('goalTarget', { valueAsNumber: true, min: 1, max: 7 })}
                      placeholder="e.g., 5"
                      min={1}
                      max={7}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      How many times per week? (1-7)
                    </p>
                  </div>
                )}

                {/* Specific days selector */}
                {watchedGoalFrequency === 'specific_days' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            watchedGoalDays?.includes(day.id)
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-600'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {watchedGoalDays?.length || 0} day(s) selected
                    </p>
                  </div>
                )}

                {/* Goal summary */}
                {watchedGoalFrequency && (
                  <div className="p-4 bg-teal-600/10 border border-teal-600/30 rounded-xl">
                    <div className="flex items-center gap-2 text-teal-400 font-medium mb-1">
                      <MuiIcons.Flag style={{ fontSize: 18 }} />
                      Goal Summary
                    </div>
                    <p className="text-slate-300 text-sm">
                      {watchedGoalFrequency === 'daily' && 'Complete this habit every day'}
                      {watchedGoalFrequency === 'weekly' && `Complete this habit ${watch('goalTarget') || '?'} times per week`}
                      {watchedGoalFrequency === 'specific_days' && (
                        watchedGoalDays?.length
                          ? `Complete on: ${watchedGoalDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                          : 'Select the days you want to complete this habit'
                      )}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Links Tab */}
            {activeTab === 'links' && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Resources & Links
                  </label>
                  <button
                    type="button"
                    onClick={() => appendLink({ title: '', url: '' })}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-400 hover:text-teal-300 hover:bg-teal-600/10 rounded-lg transition-colors"
                  >
                    <MuiIcons.Add style={{ fontSize: 18 }} />
                    Add Link
                  </button>
                </div>

                {linkFields.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MuiIcons.LinkOff style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
                    <p>No links added yet</p>
                    <button
                      type="button"
                      onClick={() => appendLink({ title: '', url: '' })}
                      className="mt-3 text-teal-400 hover:text-teal-300 font-medium text-sm"
                    >
                      Add your first link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkFields.map((field, index) => (
                      <div key={field.id} className="p-3 bg-slate-700/30 border border-slate-600/50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              {...register(`links.${index}.title`)}
                              placeholder="Link title (e.g., Workout Video)"
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <input
                              {...register(`links.${index}.url`)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLink(index)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                          >
                            <MuiIcons.Delete style={{ fontSize: 18 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  Add helpful resources like tutorials, apps, or articles related to this habit.
                </p>
              </>
            )}
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
