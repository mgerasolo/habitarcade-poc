/**
 * IconGrid component for the IconBrowser
 * Displays a grid of selectable icons with search highlighting
 */

import { useMemo } from 'react';
import type { IconDefinition } from './icons';

// Import Material Icons dynamically
import * as MuiIcons from '@mui/icons-material';

interface IconGridProps {
  icons: IconDefinition[];
  selectedIcon: IconDefinition | null;
  selectedColor: string;
  onSelect: (icon: IconDefinition) => void;
}

// Type for MUI icon components
type MuiIconComponent = React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

export function IconGrid({ icons, selectedIcon, selectedColor, onSelect }: IconGridProps) {
  // Memoize the icon components lookup
  const muiIconsMap = useMemo(() => {
    return MuiIcons as Record<string, MuiIconComponent>;
  }, []);

  const renderIcon = (icon: IconDefinition, color: string) => {
    if (icon.provider === 'material') {
      // Render Material UI icon
      const IconComponent = muiIconsMap[icon.class];
      if (IconComponent) {
        return <IconComponent style={{ color, fontSize: 28 }} />;
      }
      // Fallback if icon not found
      return <span className="text-lg" style={{ color }}>?</span>;
    } else {
      // Render Font Awesome icon
      return (
        <i
          className={icon.class}
          style={{ color, fontSize: 24 }}
          aria-hidden="true"
        />
      );
    }
  };

  if (icons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <MuiIcons.SearchOff style={{ fontSize: 48, marginBottom: 12 }} />
        <p className="text-lg">No icons found</p>
        <p className="text-sm text-slate-500">Try a different search term</p>
      </div>
    );
  }

  return (
    <div data-testid="icon-grid" className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
      {icons.map((icon) => {
        const isSelected = selectedIcon?.name === icon.name && selectedIcon?.provider === icon.provider;

        return (
          <button
            key={`${icon.provider}-${icon.name}`}
            onClick={() => onSelect(icon)}
            className={`
              group relative flex flex-col items-center justify-center
              p-3 rounded-xl transition-all duration-150
              ${isSelected
                ? 'bg-teal-600/30 ring-2 ring-teal-500'
                : 'bg-slate-700/50 hover:bg-slate-700 hover:scale-105'
              }
            `}
            title={`${icon.name} (${icon.provider})`}
            aria-label={`Select ${icon.name} icon`}
          >
            <div className="transition-transform group-hover:scale-110">
              {renderIcon(icon, isSelected ? selectedColor : '#94a3b8')}
            </div>

            {/* Tooltip with icon name on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                          bg-slate-900 text-white text-xs rounded whitespace-nowrap
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                          shadow-lg z-10">
              {icon.name}
              <div className="absolute top-full left-1/2 -translate-x-1/2
                            border-4 border-transparent border-t-slate-900" />
            </div>

            {/* Provider badge */}
            <div className={`
              absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px]
              flex items-center justify-center font-bold
              ${icon.provider === 'material'
                ? 'bg-blue-500 text-white'
                : 'bg-amber-500 text-black'
              }
            `}>
              {icon.provider === 'material' ? 'M' : 'F'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default IconGrid;
