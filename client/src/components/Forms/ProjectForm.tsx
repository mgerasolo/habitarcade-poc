import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useCategories,
} from '../../api';

// Predefined project colors
const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

interface ProjectFormData {
  name: string;
  description: string;
  categoryId: string;
  startDate: string;
  targetDate: string;
  icon: string;
  iconColor: string;
  color: string;
}

export function ProjectForm() {
  const { closeModal, selectedProject, setSelectedProject, openIconPicker } = useUIStore();
  const isEditMode = !!selectedProject;

  // Icon/image preview state - can be icon code, data URL, or external URL
  const [selectedIconOrImage, setSelectedIconOrImage] = useState<string | null>(
    selectedProject?.imageUrl || selectedProject?.icon || null
  );

  // API hooks
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data || [];

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: selectedProject?.name || '',
      description: selectedProject?.description || '',
      categoryId: selectedProject?.categoryId || '',
      startDate: selectedProject?.startDate || '',
      targetDate: selectedProject?.targetDate || '',
      icon: selectedProject?.icon || '',
      iconColor: selectedProject?.iconColor || '#6366f1',
      color: selectedProject?.color || '#6366f1',
    },
  });

  const watchedIconColor = watch('iconColor');
  const watchedColor = watch('color');

  // Helper to determine if value is an image URL/data URL vs icon code
  const isImageValue = (value: string | null) => {
    if (!value) return false;
    return value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://');
  };

  // Icon/image picker handler - receives either icon code or image URL
  const handleIconSelect = (iconOrImage: string, color: string) => {
    setSelectedIconOrImage(iconOrImage);
    if (isImageValue(iconOrImage)) {
      // It's an image - clear icon fields, set imageUrl via form state
      setValue('icon', '');
      setValue('iconColor', '');
    } else {
      // It's an icon code
      setValue('icon', iconOrImage);
      setValue('iconColor', color);
      // Also sync the project color with icon color
      if (color) setValue('color', color);
    }
  };

  // Open icon picker
  const handleOpenIconPicker = () => {
    openIconPicker(handleIconSelect);
  };

  // Clear selected icon/image
  const handleClearSelection = () => {
    setSelectedIconOrImage(null);
    setValue('icon', '');
    setValue('iconColor', '');
  };

  // Handle form submission
  const onSubmit = async (data: ProjectFormData) => {
    try {
      // Determine if we have an image URL to save
      const imageUrl = selectedIconOrImage && isImageValue(selectedIconOrImage)
        ? selectedIconOrImage
        : undefined;

      if (isEditMode && selectedProject) {
        await updateProject.mutateAsync({
          id: selectedProject.id,
          name: data.name,
          description: data.description || undefined,
          categoryId: data.categoryId || undefined,
          startDate: data.startDate || undefined,
          targetDate: data.targetDate || undefined,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          color: data.color || undefined,
          imageUrl: imageUrl,
        });
        toast.success('Project updated successfully');
      } else {
        await createProject.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          categoryId: data.categoryId || undefined,
          startDate: data.startDate || undefined,
          targetDate: data.targetDate || undefined,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          color: data.color || undefined,
          imageUrl: imageUrl,
        });
        toast.success('Project created successfully');
      }

      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject.mutateAsync(selectedProject.id);
      toast.success('Project deleted');
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  // Close and cleanup
  const handleClose = () => {
    setSelectedProject(null);
    closeModal();
  };

  // Render icon/image preview
  const renderPreview = () => {
    // If we have an image (data URL or external URL)
    if (selectedIconOrImage && isImageValue(selectedIconOrImage)) {
      return (
        <img
          src={selectedIconOrImage}
          alt="Selected"
          className="w-12 h-12 rounded-xl object-cover border border-slate-600"
        />
      );
    }

    // If we have an icon code
    if (selectedIconOrImage) {
      // Handle Material icons
      if (selectedIconOrImage.startsWith('material:')) {
        const iconName = selectedIconOrImage.replace('material:', '');
        const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
        if (IconComponent) {
          return (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${watchedIconColor}20` }}
            >
              <IconComponent style={{ color: watchedIconColor || '#6366f1', fontSize: 28 }} />
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
            className={selectedIconOrImage}
            style={{ color: watchedIconColor || '#6366f1', fontSize: 24 }}
            aria-hidden="true"
          />
        </div>
      );
    }

    // No selection - show placeholder
    return (
      <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
        <MuiIcons.Folder style={{ color: '#64748b', fontSize: 24 }} />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-lg md:max-w-3xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="project-form"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <MuiIcons.FolderSpecial style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Edit Project' : 'Create Project'}
                </h2>
                <p className="text-sm text-slate-400">
                  {isEditMode ? 'Update project details' : 'Organize your tasks by project'}
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
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Two-column layout on desktop */}
            <div className="md:grid md:grid-cols-2 md:gap-6">
              {/* Left column - Basic info */}
              <div className="space-y-5">
                {/* Name field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Project name is required' })}
                    placeholder="e.g., Website Redesign"
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

                {/* Description field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    placeholder="What is this project about?"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Category field */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    {...register('categoryId')}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">No category</option>
                    {categories
                      .filter((c) => !c.isDeleted)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon ? `${category.icon} ` : ''}{category.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Date fields - two columns */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Target Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target Date
                    </label>
                    <input
                      type="date"
                      {...register('targetDate')}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Visual customization */}
              <div className="space-y-5 mt-5 md:mt-0">
                {/* Icon/Image section - Unified Choose Icon button */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Icon
                  </label>
                  <div className="text-xs text-slate-500 mb-3">
                    Choose an icon, upload an image, or enter an image URL
                  </div>

                  {/* Current selection preview with choose/clear buttons */}
                  <div className="flex items-center gap-3">
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
                      className="flex-1 flex items-center gap-4 p-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all group"
                    >
                      {!selectedIconOrImage && renderPreview()}
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium">
                          {selectedIconOrImage ? 'Change Icon' : 'Choose Icon'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {selectedIconOrImage ? 'Click to select a different icon or image' : 'Select icon, upload image, or enter URL'}
                        </div>
                      </div>
                      <MuiIcons.ChevronRight
                        className="text-slate-400 group-hover:text-white transition-colors"
                        style={{ fontSize: 24 }}
                      />
                    </button>

                    {/* Clear button - only show when something is selected */}
                    {selectedIconOrImage && (
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

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`
                      w-8 h-8 rounded-lg transition-all duration-150
                      ${watchedColor === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                        : 'hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-400">Custom:</span>
                <input
                  type="color"
                  value={watchedColor}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-sm text-slate-500 font-mono">{watchedColor}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-700/30 rounded-xl">
              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Preview</div>
              <div className="flex items-center gap-3">
                {selectedIconOrImage && isImageValue(selectedIconOrImage) ? (
                  <img
                    src={selectedIconOrImage}
                    alt="Project icon"
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: watchedColor }}
                  />
                )}
                <span className="text-white font-medium">
                  {watch('name') || 'Project Name'}
                </span>
              </div>
              {watch('description') && (
                <p className="mt-1 text-sm text-slate-400 ml-6">
                  {watch('description')}
                </p>
              )}
            </div>
            {/* End Preview */}
          </div>
          {/* End Right column */}
        </div>
        {/* End Two-column grid */}
      </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
            {/* Delete button (edit mode only) */}
            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteProject.isPending}
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
                disabled={isSubmitting || createProject.isPending || updateProject.isPending}
                className={`
                  px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                  flex items-center gap-2
                  ${isSubmitting || createProject.isPending || updateProject.isPending
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25'
                  }
                `}
              >
                {(isSubmitting || createProject.isPending || updateProject.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;
