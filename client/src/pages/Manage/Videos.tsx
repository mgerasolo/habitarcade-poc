import { useState, useMemo } from 'react';
import * as MuiIcons from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  useVideos,
  useVideoCategories,
  useCreateVideo,
  useUpdateVideo,
  useDeleteVideo,
  useToggleVideoFavorite,
  useImportVideos,
} from '../../api';
import type { Video } from '../../types';

// Default video categories
const DEFAULT_CATEGORIES = [
  'motivational',
  'productivity',
  'mindset',
  'success',
  'fitness',
  'meditation',
  'creativity',
];

// Starter videos for new users
const STARTER_VIDEOS: Partial<Video>[] = [
  {
    url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    title: 'Never Give Up',
    category: 'motivational',
  },
];

// Get YouTube thumbnail from video ID
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function ManageVideos() {
  // State
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Form state
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');

  // API hooks
  const { data: videosData, isLoading, refetch } = useVideos({
    search: search || undefined,
    category: filterCategory || undefined,
    platform: filterPlatform || undefined,
    favorites: showFavoritesOnly || undefined,
    limit: 100,
  });
  const { data: categoriesData } = useVideoCategories();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();
  const toggleFavorite = useToggleVideoFavorite();
  const importVideos = useImportVideos();

  const videos = videosData?.data || [];
  const existingCategories = categoriesData?.data || [];

  // Combine existing categories with defaults
  const allCategories = useMemo(() => {
    const combined = new Set([...DEFAULT_CATEGORIES, ...existingCategories]);
    return Array.from(combined).sort();
  }, [existingCategories]);

  // Get unique platforms from videos
  const platforms = useMemo(() => {
    const platformSet = new Set(videos.map(v => v.platform).filter(Boolean));
    return Array.from(platformSet).sort();
  }, [videos]);

  // Reset form
  const resetForm = () => {
    setFormUrl('');
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setEditingVideo(null);
    setShowAddForm(false);
  };

  // Open edit form
  const openEditForm = (video: Video) => {
    setFormUrl(video.url);
    setFormTitle(video.title || '');
    setFormDescription(video.description || '');
    setFormCategory(video.category || '');
    setEditingVideo(video);
    setShowAddForm(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formUrl.trim()) {
      toast.error('Video URL is required');
      return;
    }

    try {
      if (editingVideo) {
        await updateVideo.mutateAsync({
          id: editingVideo.id,
          url: formUrl.trim(),
          title: formTitle.trim() || undefined,
          description: formDescription.trim() || undefined,
          category: formCategory || undefined,
        });
        toast.success('Video updated');
      } else {
        await createVideo.mutateAsync({
          url: formUrl.trim(),
          title: formTitle.trim() || undefined,
          description: formDescription.trim() || undefined,
          category: formCategory || undefined,
        });
        toast.success('Video added');
      }
      resetForm();
    } catch {
      toast.error('Failed to save video');
    }
  };

  // Handle delete
  const handleDelete = async (video: Video) => {
    if (!confirm(`Delete "${video.title || 'this video'}"?`)) return;

    try {
      await deleteVideo.mutateAsync(video.id);
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete video');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (video: Video) => {
    try {
      await toggleFavorite.mutateAsync(video.id);
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  // Import starter videos
  const handleImportStarters = async () => {
    try {
      await importVideos.mutateAsync(STARTER_VIDEOS);
      toast.success('Starter videos imported!');
      refetch();
    } catch {
      toast.error('Failed to import videos');
    }
  };

  // Get thumbnail for video
  const getThumbnail = (video: Video): string | null => {
    if (video.thumbnailUrl) return video.thumbnailUrl;
    if (video.platform === 'youtube' && video.videoId) {
      return getYouTubeThumbnail(video.videoId);
    }
    return null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MuiIcons.VideoLibrary style={{ fontSize: 32 }} className="text-violet-400" />
            Video Library
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your collection of inspirational video clips
          </p>
        </div>
        <div className="flex gap-2">
          {videos.length === 0 && (
            <button
              onClick={handleImportStarters}
              disabled={importVideos.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <MuiIcons.AutoAwesome style={{ fontSize: 18 }} />
              Import Starters
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <MuiIcons.Add style={{ fontSize: 20 }} />
            Add Video
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Platform filter */}
        {platforms.length > 0 && (
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        )}

        {/* Favorites filter */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
            showFavoritesOnly
              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-pink-400'
          }`}
        >
          {showFavoritesOnly ? (
            <MuiIcons.Favorite style={{ fontSize: 18 }} />
          ) : (
            <MuiIcons.FavoriteBorder style={{ fontSize: 18 }} />
          )}
          Favorites
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingVideo ? 'Edit Video' : 'Add New Video'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Video URL *</label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/... or https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Supports YouTube, YouTube Shorts, and Vimeo
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Video title"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">No category</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createVideo.isPending || updateVideo.isPending}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors flex items-center gap-2"
              >
                {(createVideo.isPending || updateVideo.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editingVideo ? 'Save Changes' : 'Add Video'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MuiIcons.VideoLibrary style={{ fontSize: 64 }} className="opacity-30 mb-4" />
          <p className="text-lg">
            {search || filterCategory || filterPlatform || showFavoritesOnly
              ? 'No videos match your filters'
              : 'No videos yet. Add some clips!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const thumbnail = getThumbnail(video);
            return (
              <div
                key={video.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-900">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title || 'Video thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                      <MuiIcons.PlayCircleOutline style={{ fontSize: 48 }} />
                    </div>
                  )}
                  {/* Platform badge */}
                  {video.platform && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded capitalize">
                      {video.platform}
                    </span>
                  )}
                  {/* Play overlay */}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MuiIcons.PlayArrow style={{ fontSize: 48 }} className="text-white" />
                  </a>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {video.title || 'Untitled'}
                      </h3>
                      {video.category && (
                        <span className="text-xs text-slate-400">
                          {video.category}
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleFavorite(video)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          video.isFavorite
                            ? 'text-pink-400 bg-pink-500/20'
                            : 'text-slate-400 hover:text-pink-400 hover:bg-slate-700'
                        }`}
                        title={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {video.isFavorite ? (
                          <MuiIcons.Favorite style={{ fontSize: 16 }} />
                        ) : (
                          <MuiIcons.FavoriteBorder style={{ fontSize: 16 }} />
                        )}
                      </button>
                      <button
                        onClick={() => openEditForm(video)}
                        className="p-1.5 text-slate-400 hover:text-violet-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit video"
                      >
                        <MuiIcons.Edit style={{ fontSize: 16 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(video)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Delete video"
                      >
                        <MuiIcons.Delete style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {videos.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          Showing {videos.length} video{videos.length !== 1 ? 's' : ''}
          {videosData?.total && videosData.total > videos.length && (
            <span> of {videosData.total}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageVideos;
