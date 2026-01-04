/**
 * IconBrowser - Unified modal for selecting icons OR images
 *
 * Features:
 * - Upload custom image (drag & drop or file picker)
 * - Enter image URL directly
 * - Enter icon code (mdi:IconName, fa-solid fa-icon)
 * - Browse Material Icons and Font Awesome icons
 * - Search by name or keywords
 * - Filter by provider (Material, Font Awesome, or All)
 * - Select custom color for icons
 * - Preview selected icon/image with color
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { IconGrid } from './IconGrid';
import { ColorPicker } from './ColorPicker';
import { ALL_ICONS, ICON_COLORS, DEFAULT_ICON_COLOR } from './icons';
import type { IconDefinition } from './icons';
import { useUIStore } from '../../stores';

// Import Font Awesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import Material Icons for preview
import * as MuiIcons from '@mui/icons-material';

type ProviderFilter = 'all' | 'material' | 'fontawesome';

// Result type for icon selection
export type IconSelectResult = {
  type: 'icon' | 'image-upload' | 'image-url';
  value: string; // icon code, or image URL/data URL
  color?: string; // only for icons
  file?: File; // only for uploads (for API upload later)
};

export function IconBrowser() {
  const { onIconSelect, closeIconPicker } = useUIStore();
  const [search, setSearch] = useState('');
  const [iconCode, setIconCode] = useState('');
  const [iconCodeError, setIconCodeError] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_ICON_COLOR);
  const [selectedIcon, setSelectedIcon] = useState<IconDefinition | null>(null);
  const [provider, setProvider] = useState<ProviderFilter>('all');

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image URL state
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null);
  const [imageUrlError, setImageUrlError] = useState('');
  const [imageUrlLoading, setImageUrlLoading] = useState(false);

  // Handle file selection (from file picker or drop)
  const handleFileSelect = (file: File) => {
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
      setUploadedImage({
        file,
        preview: event.target?.result as string,
      });
      // Clear other selections
      setSelectedIcon(null);
      setImageUrlPreview(null);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle URL load
  const handleUrlLoad = async () => {
    if (!imageUrl.trim()) return;

    setImageUrlLoading(true);
    setImageUrlError('');

    try {
      // Basic URL validation
      const url = new URL(imageUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL must use HTTP or HTTPS');
      }

      // Try to load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl.trim();
      });

      setImageUrlPreview(imageUrl.trim());
      // Clear other selections
      setSelectedIcon(null);
      setUploadedImage(null);
    } catch (error) {
      setImageUrlError(error instanceof Error ? error.message : 'Invalid URL');
    } finally {
      setImageUrlLoading(false);
    }
  };

  // Clear uploaded image
  const handleClearUpload = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear URL image
  const handleClearUrl = () => {
    setImageUrl('');
    setImageUrlPreview(null);
    setImageUrlError('');
  };

  // Handle direct icon code input (e.g., "mdi:Home", "material:Home", "fa-solid fa-check")
  const handleIconCodeSubmit = () => {
    if (!iconCode.trim()) return;

    const code = iconCode.trim();
    let iconValue = '';

    // Parse the icon code format
    if (code.startsWith('mdi:') || code.startsWith('material:')) {
      // Material icon - format: mdi:IconName or material:IconName
      const iconName = code.replace(/^(mdi:|material:)/, '');
      // Check if this Material icon exists
      const IconComponent = (MuiIcons as Record<string, unknown>)[iconName];
      if (IconComponent) {
        iconValue = `material:${iconName}`;
        setIconCodeError('');
      } else {
        setIconCodeError(`Icon "${iconName}" not found in Material Icons`);
        return;
      }
    } else if (code.startsWith('fa-') || code.startsWith('fab ') || code.startsWith('fas ') || code.startsWith('far ')) {
      // Font Awesome icon - use the code directly
      iconValue = code;
      setIconCodeError('');
    } else {
      setIconCodeError('Invalid format. Use: mdi:IconName, material:IconName, or fa-solid fa-icon');
      return;
    }

    if (iconValue && onIconSelect) {
      onIconSelect(iconValue, selectedColor);
      closeIconPicker();
    }
  };

  // Filter icons based on search and provider
  const filteredIcons = useMemo(() => {
    let icons = ALL_ICONS;

    // Filter by provider
    if (provider !== 'all') {
      icons = icons.filter((i) => i.provider === provider);
    }

    // Filter by search term
    if (search) {
      const lower = search.toLowerCase().trim();
      icons = icons.filter(
        (i) =>
          i.name.toLowerCase().includes(lower) ||
          i.keywords.some((k) => k.includes(lower))
      );
    }

    return icons;
  }, [search, provider]);

  // Handle icon selection
  const handleSelect = () => {
    if (selectedIcon && onIconSelect) {
      // Format: "material:IconName" or "fa-solid fa-icon-name"
      const iconValue =
        selectedIcon.provider === 'material'
          ? `material:${selectedIcon.class}`
          : selectedIcon.class;

      onIconSelect(iconValue, selectedColor);
      closeIconPicker();
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeIconPicker();
      } else if (e.key === 'Enter' && selectedIcon) {
        handleSelect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIcon, closeIconPicker]);

  // Render preview icon
  const renderPreviewIcon = () => {
    if (!selectedIcon) {
      return (
        <div className="w-16 h-16 rounded-xl bg-slate-700/50 flex items-center justify-center">
          <MuiIcons.HelpOutline style={{ color: '#64748b', fontSize: 32 }} />
        </div>
      );
    }

    if (selectedIcon.provider === 'material') {
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[selectedIcon.class];
      if (IconComponent) {
        return (
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${selectedColor}20` }}
          >
            <IconComponent style={{ color: selectedColor, fontSize: 40 }} />
          </div>
        );
      }
    }

    return (
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${selectedColor}20` }}
      >
        <i
          className={selectedIcon.class}
          style={{ color: selectedColor, fontSize: 32 }}
          aria-hidden="true"
        />
      </div>
    );
  };

  // Provider stats for tabs
  const providerStats = useMemo(() => {
    return {
      all: ALL_ICONS.length,
      material: ALL_ICONS.filter((i) => i.provider === 'material').length,
      fontawesome: ALL_ICONS.filter((i) => i.provider === 'fontawesome').length,
    };
  }, []);

  // Determine what's currently selected
  const hasUploadedImage = !!uploadedImage;
  const hasUrlImage = !!imageUrlPreview;
  const hasSelectedIcon = !!selectedIcon;
  const hasAnySelection = hasUploadedImage || hasUrlImage || hasSelectedIcon;

  // Handle the unified select action
  const handleUnifiedSelect = () => {
    if (hasUploadedImage && uploadedImage) {
      // For uploaded images, we pass the data URL and the file
      onIconSelect?.(uploadedImage.preview, '');
      closeIconPicker();
    } else if (hasUrlImage && imageUrlPreview) {
      // For URL images, we pass the URL
      onIconSelect?.(imageUrlPreview, '');
      closeIconPicker();
    } else if (hasSelectedIcon && selectedIcon) {
      // For icons, format and pass the icon code
      const iconValue =
        selectedIcon.provider === 'material'
          ? `material:${selectedIcon.class}`
          : selectedIcon.class;
      onIconSelect?.(iconValue, selectedColor);
      closeIconPicker();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeIconPicker()}
      data-testid="icon-browser-modal"
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                <MuiIcons.Apps style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Choose an Icon</h2>
                <p className="text-sm text-slate-400">
                  Upload image, enter URL, or browse {filteredIcons.length} icons
                </p>
              </div>
            </div>
            <button
              onClick={closeIconPicker}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <MuiIcons.Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: 20 }}
            />
            <input
              type="text"
              placeholder="Search icons by name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <MuiIcons.Close style={{ fontSize: 18 }} />
              </button>
            )}
          </div>

          {/* Direct Icon Code Input */}
          <div className="mt-4 p-3 bg-slate-700/30 border border-slate-600 rounded-xl">
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <MuiIcons.Code style={{ fontSize: 14 }} />
              Enter Icon Code Directly
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., mdi:Home, material:Settings, fa-solid fa-check"
                value={iconCode}
                onChange={(e) => {
                  setIconCode(e.target.value);
                  setIconCodeError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleIconCodeSubmit();
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleIconCodeSubmit}
                disabled={!iconCode.trim()}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${iconCode.trim()
                    ? 'bg-teal-600 text-white hover:bg-teal-500'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                Use Code
              </button>
            </div>
            {iconCodeError && (
              <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <MuiIcons.ErrorOutline style={{ fontSize: 14 }} />
                {iconCodeError}
              </div>
            )}
          </div>

          {/* Provider tabs */}
          <div className="flex gap-2 mt-4">
            {([
              { key: 'all', label: 'All Icons' },
              { key: 'material', label: 'Material' },
              { key: 'fontawesome', label: 'Font Awesome' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setProvider(key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${provider === key
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                {label}
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    provider === key
                      ? 'bg-teal-500/50 text-teal-100'
                      : 'bg-slate-600 text-slate-400'
                  }`}
                >
                  {providerStats[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-800/50">
          {/* Upload Image Section */}
          <div data-testid="icon-upload-section" className="mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <MuiIcons.CloudUpload style={{ fontSize: 16 }} />
              Upload Image
            </div>
            {uploadedImage ? (
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 border border-slate-600 rounded-xl">
                <img
                  src={uploadedImage.preview}
                  alt="Uploaded preview"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{uploadedImage.file.name}</div>
                  <div className="text-sm text-slate-400">
                    {(uploadedImage.file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearUpload}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <MuiIcons.Delete style={{ fontSize: 20 }} />
                  </button>
                  <button
                    onClick={handleUnifiedSelect}
                    data-testid="icon-upload-confirm"
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors font-medium text-sm"
                  >
                    Use This Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                data-testid="icon-upload-dropzone"
                className={`
                  relative p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer
                  ${isDragging
                    ? 'border-teal-400 bg-teal-500/10'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  data-testid="icon-upload-input"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <div className="flex flex-col items-center text-center">
                  <MuiIcons.CloudUpload
                    style={{ fontSize: 32 }}
                    className={isDragging ? 'text-teal-400' : 'text-slate-500'}
                  />
                  <div className="mt-2 text-sm text-slate-300">
                    <span className="text-teal-400 font-medium">Click to upload</span> or drag and drop
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    PNG, JPG, GIF, WebP, SVG (max 5MB)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image URL Section */}
          <div data-testid="icon-url-section" className="mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <MuiIcons.Link style={{ fontSize: 16 }} />
              Image URL
            </div>
            <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-xl">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/icon.png"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageUrlError('');
                  }}
                  data-testid="icon-url-input"
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  onClick={handleUrlLoad}
                  disabled={!imageUrl.trim() || imageUrlLoading}
                  data-testid="icon-url-load-button"
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                    ${imageUrl.trim() && !imageUrlLoading
                      ? 'bg-slate-600 text-white hover:bg-slate-500'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  {imageUrlLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MuiIcons.Download style={{ fontSize: 16 }} />
                      Load
                    </>
                  )}
                </button>
              </div>
              {imageUrlError && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <MuiIcons.ErrorOutline style={{ fontSize: 14 }} />
                  {imageUrlError}
                </div>
              )}
              {imageUrlPreview && (
                <div className="mt-3 flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
                  <img
                    src={imageUrlPreview}
                    alt="URL preview"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-500"
                    onError={() => {
                      setImageUrlError('Failed to load image');
                      setImageUrlPreview(null);
                    }}
                  />
                  <div className="flex-1 text-sm text-slate-300 truncate">{imageUrlPreview}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearUrl}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <MuiIcons.Close style={{ fontSize: 18 }} />
                    </button>
                    <button
                      onClick={handleUnifiedSelect}
                      data-testid="icon-url-confirm"
                      className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors font-medium text-sm"
                    >
                      Use URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Or Browse Icons</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>

          {/* Icon grid */}
          <IconGrid
            icons={filteredIcons}
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onSelect={(icon) => {
              setSelectedIcon(icon);
              // Clear image selections when selecting an icon
              setUploadedImage(null);
              setImageUrlPreview(null);
              setImageUrl('');
            }}
          />
        </div>

        {/* Footer with color picker and preview */}
        <div className="p-5 border-t border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Preview section */}
            <div className="flex items-center gap-4">
              {hasUploadedImage && uploadedImage ? (
                <img
                  src={uploadedImage.preview}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-600"
                />
              ) : hasUrlImage && imageUrlPreview ? (
                <img
                  src={imageUrlPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-600"
                />
              ) : (
                renderPreviewIcon()
              )}
              <div className="min-w-0">
                <div className="text-sm text-slate-400">Selected</div>
                <div className="text-white font-medium truncate">
                  {hasUploadedImage && uploadedImage
                    ? uploadedImage.file.name
                    : hasUrlImage
                    ? 'Image from URL'
                    : selectedIcon
                    ? selectedIcon.name
                    : 'Nothing selected'}
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {hasUploadedImage
                    ? 'Uploaded Image'
                    : hasUrlImage
                    ? 'External URL'
                    : selectedIcon
                    ? selectedIcon.provider
                    : ''}
                </div>
              </div>
            </div>

            {/* Color picker - only show for icon selection */}
            {!hasUploadedImage && !hasUrlImage && (
              <div className="flex-1">
                <ColorPicker
                  colors={ICON_COLORS}
                  selected={selectedColor}
                  onSelect={setSelectedColor}
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-700">
            <button
              onClick={closeIconPicker}
              className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUnifiedSelect}
              disabled={!hasAnySelection}
              data-testid="icon-browser-select-button"
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                ${hasAnySelection
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 shadow-lg shadow-teal-600/25'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <MuiIcons.Check style={{ fontSize: 18 }} />
                Select Icon
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IconBrowser;
