/**
 * ColorPicker component for the IconBrowser
 * Allows users to select a color for their icon
 */

interface ColorPickerProps {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ colors, selected, onSelect }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">Icon Color</label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = color === selected;
          const isWhite = color === '#ffffff';

          return (
            <button
              key={color}
              onClick={() => onSelect(color)}
              className={`
                w-8 h-8 rounded-lg transition-all duration-150
                ${isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110'
                  : 'hover:scale-110'
                }
                ${isWhite ? 'border border-slate-600' : ''}
              `}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Select color ${color}`}
            />
          );
        })}
      </div>

      {/* Color preview with selected color */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700">
        <div
          className="w-10 h-10 rounded-lg shadow-inner"
          style={{ backgroundColor: selected }}
        />
        <div className="text-sm">
          <div className="text-slate-400">Selected</div>
          <div className="text-slate-200 font-mono">{selected}</div>
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;
