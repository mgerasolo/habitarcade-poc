import { useState, useEffect, useCallback } from 'react';
import * as MuiIcons from '@mui/icons-material';
import { useVideos, useToggleVideoFavorite, useVideoCategories } from '../../api';
import type { Video } from '../../types';

// Default video categories
const DEFAULT_CATEGORIES = [
  'motivational',
  'productivity',
  'mindset',
  'success',
  'fitness',
  'meditation',
];

interface VideoClipsWidgetProps {
  showControls?: boolean;
  autoAdvance?: boolean;
  autoAdvanceInterval?: number; // in seconds
}

// Get YouTube embed URL from video ID
function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

// Get Vimeo embed URL from video ID
function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

// Get embed URL based on platform
function getEmbedUrl(video: Video): string | null {
  if (!video.videoId) return null;

  switch (video.platform) {
    case 'youtube':
      return getYouTubeEmbedUrl(video.videoId);
    case 'vimeo':
      return getVimeoEmbedUrl(video.videoId);
    default:
      return null;
  }
}

// Format duration in seconds to MM:SS
function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * VideoClips Widget - displays short video clips with carousel navigation
 */
export function VideoClipsWidget({
  showControls = true,
  autoAdvance = false,
  autoAdvanceInterval = 60,
}: VideoClipsWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch videos
  const { data: videosData, isLoading, isError } = useVideos({
    category: filterCategory || undefined,
    favorites: showFavoritesOnly || undefined,
    limit: 50,
  });

  const { data: categoriesData } = useVideoCategories();
  const toggleFavorite = useToggleVideoFavorite();

  const videos = videosData?.data || [];
  const existingCategories = categoriesData?.data || [];
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])].sort();
  const currentVideo: Video | undefined = videos[currentIndex];

  // Navigate to next video
  const nextVideo = useCallback(() => {
    if (videos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  // Navigate to previous video
  const prevVideo = useCallback(() => {
    if (videos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  // Random video
  const randomVideo = useCallback(() => {
    if (videos.length === 0) return;
    const newIndex = Math.floor(Math.random() * videos.length);
    setCurrentIndex(newIndex);
  }, [videos.length]);

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    if (!currentVideo) return;
    try {
      await toggleFavorite.mutateAsync(currentVideo.id);
    } catch {
      // Error handled by mutation
    }
  };

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filterCategory, showFavoritesOnly]);

  // Auto-advance (optional)
  useEffect(() => {
    if (!autoAdvance || videos.length <= 1) return;

    const interval = setInterval(() => {
      nextVideo();
    }, autoAdvanceInterval * 1000);

    return () => clearInterval(interval);
  }, [autoAdvance, autoAdvanceInterval, nextVideo, videos.length]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>Failed to load videos</p>
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <MuiIcons.VideoLibrary style={{ fontSize: 48 }} className="opacity-50" />
        <p className="text-sm">
          {filterCategory || showFavoritesOnly
            ? 'No videos match your filters'
            : 'No videos yet. Add some clips!'}
        </p>
      </div>
    );
  }

  const embedUrl = currentVideo ? getEmbedUrl(currentVideo) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Controls bar */}
      {showControls && (
        <div className="flex items-center gap-2 mb-3 px-1">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 px-2 py-1 text-xs bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Favorites filter */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-1.5 rounded-lg transition-colors ${
              showFavoritesOnly
                ? 'bg-pink-500/20 text-pink-400'
                : 'text-slate-400 hover:text-pink-400 hover:bg-slate-700/50'
            }`}
            title={showFavoritesOnly ? 'Show all' : 'Show favorites only'}
          >
            {showFavoritesOnly ? (
              <MuiIcons.Favorite style={{ fontSize: 16 }} />
            ) : (
              <MuiIcons.FavoriteBorder style={{ fontSize: 16 }} />
            )}
          </button>
        </div>
      )}

      {/* Video player area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Video embed */}
        <div className="relative flex-1 min-h-0 bg-black rounded-lg overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={currentVideo?.title || 'Video'}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <MuiIcons.PlayCircleOutline style={{ fontSize: 48 }} />
                <p className="text-xs mt-2">
                  {currentVideo?.platform === 'instagram' || currentVideo?.platform === 'tiktok'
                    ? `${currentVideo.platform} embeds not supported`
                    : 'Unable to play video'}
                </p>
                {currentVideo?.url && (
                  <a
                    href={currentVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-xs mt-2 inline-flex items-center gap-1"
                  >
                    Open in new tab <MuiIcons.OpenInNew style={{ fontSize: 12 }} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="mt-3">
          {currentVideo?.title && (
            <h3 className="text-sm font-medium text-white truncate">
              {currentVideo.title}
            </h3>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            {currentVideo?.platform && (
              <span className="capitalize">{currentVideo.platform}</span>
            )}
            {currentVideo?.duration && (
              <span>{formatDuration(currentVideo.duration)}</span>
            )}
            {currentVideo?.category && (
              <span className="px-1.5 py-0.5 rounded bg-slate-700/50">
                {currentVideo.category}
              </span>
            )}
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevVideo}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Previous video"
            >
              <MuiIcons.SkipPrevious style={{ fontSize: 20 }} />
            </button>
            <button
              onClick={randomVideo}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Random video"
            >
              <MuiIcons.Shuffle style={{ fontSize: 18 }} />
            </button>
            <button
              onClick={nextVideo}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Next video"
            >
              <MuiIcons.SkipNext style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Position indicator */}
          <div className="flex items-center gap-1">
            {videos.length <= 10 ? (
              videos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-violet-500' : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))
            ) : (
              <span className="text-xs text-slate-500">
                {currentIndex + 1} / {videos.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleFavorite}
              disabled={toggleFavorite.isPending}
              className={`p-1.5 rounded-lg transition-colors ${
                currentVideo?.isFavorite
                  ? 'text-pink-400 bg-pink-500/20'
                  : 'text-slate-400 hover:text-pink-400 hover:bg-slate-700/50'
              }`}
              title={currentVideo?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {currentVideo?.isFavorite ? (
                <MuiIcons.Favorite style={{ fontSize: 18 }} />
              ) : (
                <MuiIcons.FavoriteBorder style={{ fontSize: 18 }} />
              )}
            </button>
            {currentVideo?.url && (
              <a
                href={currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Open original"
              >
                <MuiIcons.OpenInNew style={{ fontSize: 16 }} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoClipsWidget;
