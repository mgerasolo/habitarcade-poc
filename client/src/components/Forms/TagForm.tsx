import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useUIStore } from '../../stores';
import {
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from '../../api';

// Predefined tag colors
const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
];

interface TagFormData {
  name: string;
  color: string;
}

// Extended UI Store interface for tags (if not already defined)
interface ExtendedUIStore {
  closeModal: () => void;
  modalData: unknown;
}

export function TagForm() {
  const { closeModal, modalData } = useUIStore() as ExtendedUIStore;

  // Extract tag from modal data if editing
  const selectedTag = (modalData as { tag?: { id: string; name: string; color?: string } })?.tag;
  const isEditMode = !!selectedTag;

  // API hooks
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    defaultValues: {
      name: selectedTag?.name || '',
      color: selectedTag?.color || '#3b82f6',
    },
  });

  const watchedColor = watch('color');
  const watchedName = watch('name');

  // Handle form submission
  const onSubmit = async (data: TagFormData) => {
    try {
      if (isEditMode && selectedTag) {
        await updateTag.mutateAsync({
          id: selectedTag.id,
          name: data.name,
          color: data.color || undefined,
        });
        toast.success('Tag updated successfully');
      } else {
        await createTag.mutateAsync({
          name: data.name,
          color: data.color || undefined,
        });
        toast.success('Tag created successfully');
      }
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tag');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTag) return;

    try {
      await deleteTag.mutateAsync(selectedTag.id);
      toast.success('Tag deleted');
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tag');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <MuiIcons.LocalOffer style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? 'Edit Tag' : 'Create Tag'}
                </h2>
                <p className="text-sm text-slate-400">
                  {isEditMode ? 'Update tag details' : 'Label your tasks'}
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
                Tag Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('name', {
                  required: 'Tag name is required',
                  maxLength: { value: 30, message: 'Tag name must be 30 characters or less' },
                })}
                placeholder="e.g., urgent, work, personal"
                className={`
                  w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white
                  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500
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
                Tag Color
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`
                      w-7 h-7 rounded-lg transition-all duration-150
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
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-sm text-slate-500 font-mono">{watchedColor}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-700/30 rounded-xl">
              <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Preview</div>
              <div className="flex flex-wrap gap-2">
                {/* Badge style */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${watchedColor}20`,
                    color: watchedColor,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: watchedColor }}
                  />
                  {watchedName || 'tag-name'}
                </span>

                {/* Pill style */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: watchedColor }}
                >
                  {watchedName || 'tag-name'}
                </span>

                {/* Outline style */}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border"
                  style={{
                    borderColor: watchedColor,
                    color: watchedColor,
                  }}
                >
                  {watchedName || 'tag-name'}
                </span>
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
                disabled={deleteTag.isPending}
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
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createTag.isPending || updateTag.isPending}
                className={`
                  px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                  flex items-center gap-2
                  ${isSubmitting || createTag.isPending || updateTag.isPending
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25'
                  }
                `}
              >
                {(isSubmitting || createTag.isPending || updateTag.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create Tag'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TagForm;
