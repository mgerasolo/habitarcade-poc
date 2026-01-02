import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useUploadProjectImage,
  useDeleteProjectImage,
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
  icon: string;
  iconColor: string;
  color: string;
}

export function ProjectForm() {
  const { closeModal, selectedProject, setSelectedProject, openIconPicker } = useUIStore();
  const isEditMode = !!selectedProject;

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(selectedProject?.imageUrl || null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // API hooks
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const uploadImage = useUploadProjectImage();
  const deleteImage = useDeleteProjectImage();

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
      icon: selectedProject?.icon || '',
      iconColor: selectedProject?.iconColor || '#6366f1',
      color: selectedProject?.color || '#6366f1',
    },
  });

  const watchedIcon = watch('icon');
  const watchedIconColor = watch('iconColor');
  const watchedColor = watch('color');

  // Icon picker handler
  const handleIconSelect = (icon: string, color: string) => {
    setValue('icon', icon);
    setValue('iconColor', color);
    // Also sync the project color with icon color
    setValue('color', color);
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPendingImageFile(file);

    // Clear the icon when an image is selected
    setValue('icon', '');
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    if (isEditMode && selectedProject?.imageUrl && !pendingImageFile) {
      // Delete from server
      try {
        await deleteImage.mutateAsync(selectedProject.id);
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
  const onSubmit = async (data: ProjectFormData) => {
    try {
      let projectId: string;

      if (isEditMode && selectedProject) {
        await updateProject.mutateAsync({
          id: selectedProject.id,
          name: data.name,
          description: data.description || undefined,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          color: data.color || undefined,
        });
        projectId = selectedProject.id;
        toast.success('Project updated successfully');
      } else {
        const result = await createProject.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          icon: data.icon || undefined,
          iconColor: data.iconColor || undefined,
          color: data.color || undefined,
        });
        projectId = result.data.id;
        toast.success('Project created successfully');
      }

      // Upload image if there's a pending file
      if (pendingImageFile && projectId) {
        try {
          await uploadImage.mutateAsync({ id: projectId, file: pendingImageFile });
          toast.success('Image uploaded');
        } catch (error) {
          toast.error('Project saved but image upload failed');
        }
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

  // Render icon preview
  const renderIconPreview = () => {
    if (!watchedIcon) {
      return (
        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
          <MuiIcons.Folder style={{ color: '#64748b', fontSize: 24 }} />
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
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
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
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Icon/Image section */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Icon
              </label>
              <div className="text-xs text-slate-500 mb-3">
                Choose an icon from the library or upload your own image
              </div>

              {/* Custom Image Upload */}
              {imagePreview ? (
                <div className="mb-3 p-3 bg-slate-700/50 border border-slate-600 rounded-xl">
                  <div className="flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Project icon preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-500"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">Custom Image</div>
                      <div className="text-sm text-slate-400">
                        {pendingImageFile ? pendingImageFile.name : 'Uploaded image'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={deleteImage.isPending}
                      className="p-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
                      aria-label="Remove image"
                    >
                      {deleteImage.isPending ? (
                        <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <MuiIcons.Close style={{ fontSize: 20 }} />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="mb-3 flex items-center gap-4 p-3 bg-slate-700/50 border border-dashed border-slate-500 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center group-hover:bg-slate-500 transition-colors">
                    <MuiIcons.CloudUpload style={{ color: '#94a3b8', fontSize: 24 }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Upload Custom Image</div>
                    <div className="text-sm text-slate-400">PNG, JPG, GIF, WebP or SVG (max 5MB)</div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* Divider */}
              {!imagePreview && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-slate-600" />
                  <span className="text-xs text-slate-500 uppercase">or</span>
                  <div className="flex-1 h-px bg-slate-600" />
                </div>
              )}

              {/* Icon picker button - only show if no image */}
              {!imagePreview && (
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
              )}
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
                {imagePreview ? (
                  <img
                    src={imagePreview}
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
