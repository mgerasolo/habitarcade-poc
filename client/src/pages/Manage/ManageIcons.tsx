import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useIconsStore, type CustomIcon, type UploadedImage } from '../../stores';
import { useUIStore } from '../../stores';

/**
 * Add Custom Icon Modal
 */
function AddIconModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (code: string, label: string) => void;
}) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [previewValid, setPreviewValid] = useState<boolean | null>(null);

  // Validate icon code and show preview
  const validateIconCode = (iconCode: string) => {
    if (!iconCode.trim()) {
      setPreviewValid(null);
      return;
    }

    // Check if it's a valid Material icon
    if (iconCode.startsWith('material:') || iconCode.startsWith('mdi:')) {
      const iconName = iconCode.replace(/^(material:|mdi:)/, '');
      const IconComponent = (MuiIcons as Record<string, unknown>)[iconName];
      setPreviewValid(!!IconComponent);
    } else if (iconCode.startsWith('fa-') || iconCode.startsWith('fab ') || iconCode.startsWith('fas ') || iconCode.startsWith('far ')) {
      // Font Awesome - assume valid (we can't easily validate)
      setPreviewValid(true);
    } else {
      setPreviewValid(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    setError('');
    validateIconCode(value);
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      setError('Icon code is required');
      return;
    }
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (previewValid === false) {
      setError('Invalid icon code format');
      return;
    }

    onAdd(code.trim(), label.trim());
    setCode('');
    setLabel('');
    setError('');
    setPreviewValid(null);
    onClose();
  };

  // Render preview icon
  const renderPreview = () => {
    if (!code.trim() || previewValid === null) {
      return (
        <div className="w-16 h-16 rounded-xl bg-slate-700/50 flex items-center justify-center">
          <MuiIcons.HelpOutline style={{ color: '#64748b', fontSize: 32 }} />
        </div>
      );
    }

    if (previewValid === false) {
      return (
        <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center">
          <MuiIcons.Close style={{ color: '#ef4444', fontSize: 32 }} />
        </div>
      );
    }

    // Valid icon - render it
    if (code.startsWith('material:') || code.startsWith('mdi:')) {
      const iconName = code.replace(/^(material:|mdi:)/, '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div className="w-16 h-16 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <IconComponent style={{ color: '#14b8a6', fontSize: 32 }} />
          </div>
        );
      }
    }

    // Font Awesome
    return (
      <div className="w-16 h-16 rounded-xl bg-teal-500/20 flex items-center justify-center">
        <i className={code} style={{ color: '#14b8a6', fontSize: 28 }} />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center border border-teal-500/30">
              <MuiIcons.Add style={{ color: '#14b8a6', fontSize: 22 }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Add Custom Icon</h2>
              <p className="text-sm text-slate-400">Enter an icon code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
          >
            <MuiIcons.Close style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            {renderPreview()}
          </div>

          {/* Icon Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Icon Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g., material:Home, fa-solid fa-check"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500">
              Format: material:IconName, mdi:IconName, or fa-solid fa-icon-name
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., My Custom Icon"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <MuiIcons.ErrorOutline style={{ fontSize: 16 }} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors font-medium flex items-center gap-2"
          >
            <MuiIcons.Add style={{ fontSize: 18 }} />
            Add Icon
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Manage Icons Page
 *
 * Features:
 * - View all custom icon codes with preview
 * - View all uploaded images with preview
 * - Add new icon codes
 * - Delete icons/images
 * - View recently used icons
 */
export function ManageIcons() {
  const {
    customIcons,
    recentIcons,
    uploadedImages,
    addCustomIcon,
    removeCustomIcon,
    removeUploadedImage,
    clearRecentIcons,
  } = useIconsStore();
  const { openModal } = useUIStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'custom' | 'uploaded' | 'recent'>('custom');

  // Filter custom icons by search
  const filteredCustomIcons = useMemo(() => {
    if (!searchQuery) return customIcons;
    const query = searchQuery.toLowerCase();
    return customIcons.filter(
      (icon) =>
        icon.label.toLowerCase().includes(query) ||
        icon.code.toLowerCase().includes(query)
    );
  }, [customIcons, searchQuery]);

  // Filter uploaded images by search
  const filteredUploadedImages = useMemo(() => {
    if (!searchQuery) return uploadedImages;
    const query = searchQuery.toLowerCase();
    return uploadedImages.filter((img) => img.name.toLowerCase().includes(query));
  }, [uploadedImages, searchQuery]);

  // Handle delete with confirmation
  const handleDeleteIcon = (icon: CustomIcon) => {
    openModal('confirm-delete', {
      title: 'Delete Custom Icon',
      message: `Are you sure you want to delete "${icon.label}"?`,
      onConfirm: () => {
        removeCustomIcon(icon.id);
        toast.success(`Deleted "${icon.label}"`);
      },
    });
  };

  const handleDeleteImage = (image: UploadedImage) => {
    openModal('confirm-delete', {
      title: 'Delete Uploaded Image',
      message: `Are you sure you want to delete "${image.name}"?`,
      onConfirm: () => {
        removeUploadedImage(image.id);
        toast.success(`Deleted "${image.name}"`);
      },
    });
  };

  // Render icon preview
  const renderIconPreview = (code: string, color?: string) => {
    const iconColor = color || '#14b8a6';

    if (code.startsWith('material:') || code.startsWith('mdi:')) {
      const iconName = code.replace(/^(material:|mdi:)/, '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <IconComponent style={{ color: iconColor, fontSize: 22 }} />
          </div>
        );
      }
    }

    // Font Awesome or image URL
    if (code.startsWith('http') || code.startsWith('data:')) {
      return (
        <img
          src={code}
          alt="Icon"
          className="w-10 h-10 rounded-lg object-cover"
        />
      );
    }

    return (
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <i className={code} style={{ color: iconColor, fontSize: 18 }} />
      </div>
    );
  };

  return (
    <div className="p-6" data-testid="manage-icons-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <MuiIcons.Apps style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Icons</h1>
            <p className="text-sm text-slate-400">
              {customIcons.length} custom icons, {uploadedImages.length} uploaded images
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          data-testid="add-icon-button"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Icon Code
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('custom')}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'custom'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }
          `}
        >
          Custom Icons
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-600/50">
            {customIcons.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('uploaded')}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'uploaded'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }
          `}
        >
          Uploaded Images
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-600/50">
            {uploadedImages.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'recent'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }
          `}
        >
          Recently Used
          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-600/50">
            {recentIcons.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MuiIcons.Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          style={{ fontSize: 20 }}
        />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'custom' ? 'icons' : activeTab === 'uploaded' ? 'images' : 'recent icons'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Custom Icons Tab */}
        {activeTab === 'custom' && (
          <>
            {filteredCustomIcons.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MuiIcons.Apps style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
                <p>{searchQuery ? 'No icons match your search' : 'No custom icons yet'}</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-teal-400 hover:text-teal-300 font-medium"
                >
                  Add your first custom icon
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredCustomIcons.map((icon) => (
                  <div
                    key={icon.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {renderIconPreview(icon.code)}
                      <div>
                        <div className="text-white font-medium">{icon.label}</div>
                        <div className="text-sm text-slate-400 font-mono">{icon.code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(icon.code);
                          toast.success('Copied icon code');
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Copy code"
                      >
                        <MuiIcons.ContentCopy style={{ fontSize: 18 }} />
                      </button>
                      <button
                        onClick={() => handleDeleteIcon(icon)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <MuiIcons.Delete style={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Uploaded Images Tab */}
        {activeTab === 'uploaded' && (
          <>
            {filteredUploadedImages.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MuiIcons.CloudUpload style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
                <p>{searchQuery ? 'No images match your search' : 'No uploaded images yet'}</p>
                <p className="text-sm mt-2">
                  Upload images through the Icon Browser when selecting icons
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                {filteredUploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative bg-slate-700/30 rounded-xl overflow-hidden"
                  >
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-white text-xs font-medium truncate">{image.name}</div>
                        <div className="text-slate-400 text-xs">
                          {(image.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      title="Delete"
                    >
                      <MuiIcons.Delete style={{ fontSize: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Recent Icons Tab */}
        {activeTab === 'recent' && (
          <>
            {recentIcons.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MuiIcons.History style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
                <p>No recently used icons</p>
                <p className="text-sm mt-2">
                  Icons you use will appear here for quick access
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                  <span className="text-sm text-slate-400">
                    Last {recentIcons.length} used icons
                  </span>
                  <button
                    onClick={() => {
                      clearRecentIcons();
                      toast.success('Cleared recent icons');
                    }}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-4">
                  {recentIcons.map((recent, index) => (
                    <div
                      key={`${recent.code}-${index}`}
                      className="aspect-square flex items-center justify-center bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                      title={recent.code}
                    >
                      {renderIconPreview(recent.code, recent.color)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Icon Modal */}
      <AddIconModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(code, label) => {
          addCustomIcon(code, label);
          toast.success(`Added "${label}"`);
        }}
      />
    </div>
  );
}

export default ManageIcons;
