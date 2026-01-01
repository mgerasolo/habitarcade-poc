import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useTags, useDeleteTag, useCreateTag, useUpdateTag } from '../../api';
import { useUIStore } from '../../stores';
import type { Tag } from '../../types';

// Predefined color options
const COLOR_OPTIONS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
];

/**
 * Manage Tags Page
 *
 * Features:
 * - View all tags in a table/list
 * - Create new tags with color picker
 * - Edit existing tags
 * - Delete tags with confirmation
 */
export function ManageTags() {
  const { data: tagsData, isLoading } = useTags();
  const deleteTag = useDeleteTag();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const { openModal } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // New tag state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  // Filter and sort tags
  const tags = useMemo(() => {
    if (!tagsData?.data) return [];

    let filtered = tagsData.data.filter((t: Tag) => !t.isDeleted);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t: Tag) =>
        t.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a: Tag, b: Tag) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tagsData, searchQuery, sortBy, sortDirection]);

  // Handle edit start
  const handleEditStart = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color || COLOR_OPTIONS[0]);
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateTag.mutateAsync({
        id: editingId,
        name: editName.trim(),
        color: editColor,
      });
      toast.success('Tag updated');
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update tag');
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  // Handle delete with confirmation
  const handleDelete = (tag: Tag) => {
    openModal('confirm-delete', {
      title: 'Delete Tag',
      message: `Are you sure you want to delete "${tag.name}"? This will remove the tag from all tasks.`,
      onConfirm: async () => {
        try {
          await deleteTag.mutateAsync(tag.id);
          toast.success(`Deleted "${tag.name}"`);
        } catch (error) {
          toast.error('Failed to delete tag');
        }
      }
    });
  };

  // Handle add new
  const handleAddStart = () => {
    setIsAdding(true);
    setNewName('');
    setNewColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
  };

  // Handle add save
  const handleAddSave = async () => {
    if (!newName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      await createTag.mutateAsync({
        name: newName.trim(),
        color: newColor,
      });
      toast.success('Tag created');
      setIsAdding(false);
      setNewName('');
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  // Handle add cancel
  const handleAddCancel = () => {
    setIsAdding(false);
    setNewName('');
  };

  // Toggle sort
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-6" data-testid="manage-tags-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <MuiIcons.LocalOffer style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Tags</h1>
            <p className="text-sm text-slate-400">{tags.length} tags</p>
          </div>
        </div>
        <button
          onClick={handleAddStart}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Tag
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-6 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
            Tag
            {sortBy === 'name' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2">Color</div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('created')}>
            Created
            {sortBy === 'created' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* New Tag Row */}
        {isAdding && (
          <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center bg-slate-700/30 border-b border-slate-700">
            {/* Name Input */}
            <div className="col-span-6">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tag name..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSave();
                  if (e.key === 'Escape') handleAddCancel();
                }}
              />
            </div>

            {/* Color Picker */}
            <div className="col-span-2 flex items-center gap-1">
              {COLOR_OPTIONS.slice(0, 5).map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${newColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Spacer */}
            <div className="col-span-2" />

            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={handleAddCancel}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Cancel"
              >
                <MuiIcons.Close style={{ fontSize: 18 }} />
              </button>
              <button
                onClick={handleAddSave}
                disabled={createTag.isPending}
                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/10 rounded-lg transition-colors"
                title="Save"
              >
                <MuiIcons.Check style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        )}

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
            Loading tags...
          </div>
        ) : tags.length === 0 && !isAdding ? (
          <div className="p-8 text-center text-slate-400">
            <MuiIcons.LocalOfferOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
            <p>No tags found</p>
            <button
              onClick={handleAddStart}
              className="mt-4 text-orange-400 hover:text-orange-300 font-medium"
            >
              Create your first tag
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {tags.map((tag: Tag) => (
              <div
                key={tag.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors"
              >
                {editingId === tag.id ? (
                  <>
                    {/* Edit Name Input */}
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                    </div>

                    {/* Edit Color Picker */}
                    <div className="col-span-2 flex items-center gap-1">
                      {COLOR_OPTIONS.slice(0, 5).map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform ${editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Spacer */}
                    <div className="col-span-2" />

                    {/* Edit Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={handleEditCancel}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <MuiIcons.Close style={{ fontSize: 18 }} />
                      </button>
                      <button
                        onClick={handleEditSave}
                        disabled={updateTag.isPending}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/10 rounded-lg transition-colors"
                        title="Save"
                      >
                        <MuiIcons.Check style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Tag Name */}
                    <div className="col-span-6 flex items-center gap-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: `${tag.color || '#64748b'}20`,
                          color: tag.color || '#64748b',
                        }}
                      >
                        <MuiIcons.LocalOffer style={{ fontSize: 14 }} />
                        {tag.name}
                      </span>
                    </div>

                    {/* Color */}
                    <div className="col-span-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-slate-600"
                        style={{ backgroundColor: tag.color || '#64748b' }}
                        title={tag.color || 'Default'}
                      />
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-sm text-slate-400">
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditStart(tag)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <MuiIcons.Edit style={{ fontSize: 18 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <MuiIcons.Delete style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageTags;
