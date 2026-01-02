/**
 * IconBrowser - Main modal component for selecting icons
 *
 * Features:
 * - Browse Material Icons and Font Awesome icons
 * - Search by name or keywords
 * - Filter by provider (Material, Font Awesome, or All)
 * - Select custom color for the icon
 * - Preview selected icon with color
 */

import { useState, useMemo, useEffect } from 'react';
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

export function IconBrowser() {
  const { onIconSelect, closeIconPicker } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_ICON_COLOR);
  const [selectedIcon, setSelectedIcon] = useState<IconDefinition | null>(null);
  const [provider, setProvider] = useState<ProviderFilter>('all');

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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeIconPicker()}
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
                  {filteredIcons.length} icons available
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

        {/* Icon grid - scrollable */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-800/50">
          <IconGrid
            icons={filteredIcons}
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onSelect={setSelectedIcon}
          />
        </div>

        {/* Footer with color picker and preview */}
        <div className="p-5 border-t border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Preview section */}
            <div className="flex items-center gap-4">
              {renderPreviewIcon()}
              <div className="min-w-0">
                <div className="text-sm text-slate-400">Selected</div>
                <div className="text-white font-medium truncate">
                  {selectedIcon ? selectedIcon.name : 'No icon selected'}
                </div>
                {selectedIcon && (
                  <div className="text-xs text-slate-500 capitalize">
                    {selectedIcon.provider}
                  </div>
                )}
              </div>
            </div>

            {/* Color picker */}
            <div className="flex-1">
              <ColorPicker
                colors={ICON_COLORS}
                selected={selectedColor}
                onSelect={setSelectedColor}
              />
            </div>
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
              onClick={handleSelect}
              disabled={!selectedIcon}
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all duration-150
                ${selectedIcon
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
