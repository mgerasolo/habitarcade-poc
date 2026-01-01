import { useEffect, useRef, useState, useCallback } from 'react';
import { useUIStore } from '../../stores';
import * as MuiIcons from '@mui/icons-material';

// Parking Lot types and localStorage key
interface ParkingLotItem {
  id: string;
  text: string;
  createdAt: number;
}

const PARKING_LOT_STORAGE_KEY = 'habitarcade-parking-lot';

interface RightDrawerProps {
  isOpen: boolean;
  width?: number;
  overlay?: boolean;
}

type DrawerTab = 'parking-lot' | 'priorities' | 'quick-entry' | 'properties';

const DRAWER_TABS: { id: DrawerTab; label: string; icon: keyof typeof MuiIcons }[] = [
  { id: 'parking-lot', label: 'Parking Lot', icon: 'LocalParking' },
  { id: 'priorities', label: 'Priorities', icon: 'PriorityHigh' },
  { id: 'quick-entry', label: 'Quick Entry', icon: 'FlashOn' },
  { id: 'properties', label: 'Properties', icon: 'Settings' },
];

export function RightDrawer({ isOpen, width = 320, overlay = true }: RightDrawerProps) {
  const { rightDrawerContent, setRightDrawerContent, closeRightDrawer } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close (only if overlay mode)
  useEffect(() => {
    if (!isOpen || !overlay) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        // Check if click is on the toggle button (don't close if so)
        const target = event.target as HTMLElement;
        if (target.closest('[data-drawer-toggle]')) return;
        closeRightDrawer();
      }
    };

    // Add delay to prevent immediate close when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, overlay, closeRightDrawer]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRightDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeRightDrawer]);

  const renderContent = () => {
    switch (rightDrawerContent) {
      case 'parking-lot':
        return <ParkingLotContent />;
      case 'priorities':
        return <PrioritiesContent />;
      case 'quick-entry':
        return <QuickEntryContent />;
      case 'properties':
        return <PropertiesContent />;
      default:
        return <ParkingLotContent />;
    }
  };

  const getContentTitle = () => {
    const tab = DRAWER_TABS.find(t => t.id === rightDrawerContent);
    return tab?.label || 'Drawer';
  };

  return (
    <>
      {/* Overlay backdrop */}
      {overlay && (
        <div
          className={`
            fixed inset-0 bg-black/40 backdrop-blur-sm z-40
            transition-opacity duration-300 ease-in-out
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        data-testid="right-drawer"
        className={`
          fixed right-0 top-16 h-[calc(100vh-4rem)]
          bg-slate-800/95 backdrop-blur-md border-l border-slate-700/50
          transition-transform duration-300 ease-in-out z-50
          flex flex-col shadow-2xl shadow-black/50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: `${width}px` }}
        role="complementary"
        aria-label="Right sidebar drawer"
        aria-hidden={!isOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">{getContentTitle()}</h2>
          <button
            onClick={closeRightDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            aria-label="Close drawer"
            data-testid="drawer-close-button"
          >
            <MuiIcons.Close style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-700/50 px-2 py-2 gap-1 overflow-x-auto">
          {DRAWER_TABS.map((tab) => {
            const IconComponent = MuiIcons[tab.icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
            const isActive = rightDrawerContent === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setRightDrawerContent(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-150 whitespace-nowrap
                  ${isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }
                `}
                data-testid={`drawer-tab-${tab.id}`}
                aria-selected={isActive}
              >
                <IconComponent style={{ fontSize: 14 }} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto p-4" data-testid="drawer-content">
          {renderContent()}
        </div>
      </aside>
    </>
  );
}

// Content panels

function ParkingLotContent() {
  const [items, setItems] = useState<ParkingLotItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PARKING_LOT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load parking lot items:', error);
    }
  }, []);

  // Save items to localStorage whenever they change
  const saveItems = useCallback((newItems: ParkingLotItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(PARKING_LOT_STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to save parking lot items:', error);
    }
  }, []);

  // Add a new item
  const addItem = useCallback(() => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newItem: ParkingLotItem = {
      id: `parking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: trimmedText,
      createdAt: Date.now(),
    };

    // Add to beginning (newest first)
    saveItems([newItem, ...items]);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, items, saveItems]);

  // Delete an item
  const deleteItem = useCallback((id: string) => {
    saveItems(items.filter(item => item.id !== id));
  }, [items, saveItems]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-4" data-testid="parking-lot-content">
      <p className="text-sm text-slate-400">
        Capture quick ideas to process later. Press Enter to add.
      </p>

      {/* Quick input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick idea..."
          className="flex-1 px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          data-testid="parking-lot-input"
          aria-label="Add idea to parking lot"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="px-3 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          data-testid="parking-lot-add-button"
          aria-label="Add item"
        >
          <MuiIcons.Add style={{ fontSize: 18 }} />
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-2" data-testid="parking-lot-list">
        {items.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            <MuiIcons.LocalParking style={{ fontSize: 32 }} className="mb-2 opacity-50" />
            <p>No parked ideas yet</p>
            <p className="text-xs mt-1">Add your first idea above</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-teal-500/50 transition-colors group"
              data-testid="parking-lot-item"
            >
              <div className="flex items-start gap-2">
                <MuiIcons.LightbulbOutlined style={{ fontSize: 16 }} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="flex-1 text-sm text-slate-300 break-words" data-testid="parking-lot-item-text">
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-slate-600/50 hover:bg-red-500/50 text-slate-400 hover:text-white transition-all flex-shrink-0"
                  data-testid="parking-lot-delete-button"
                  aria-label={`Delete: ${item.text}`}
                >
                  <MuiIcons.Close style={{ fontSize: 14 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item count */}
      {items.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          {items.length} {items.length === 1 ? 'idea' : 'ideas'} parked
        </div>
      )}
    </div>
  );
}

function PrioritiesContent() {
  const priorities = [
    { level: 'high', label: 'High Priority', color: 'text-red-400', bgColor: 'bg-red-500/10', count: 3 },
    { level: 'medium', label: 'Medium Priority', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', count: 5 },
    { level: 'low', label: 'Low Priority', color: 'text-blue-400', bgColor: 'bg-blue-500/10', count: 8 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        View and manage your prioritized items at a glance.
      </p>

      <div className="space-y-3">
        {priorities.map((priority) => (
          <div
            key={priority.level}
            className={`p-3 rounded-lg ${priority.bgColor} border border-slate-600/50`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${priority.color}`}>
                {priority.label}
              </span>
              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                {priority.count} items
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Click to view items
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickEntryContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Quickly add habits, tasks, or notes without leaving your current view.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Quick add
          </label>
          <input
            type="text"
            placeholder="Type and press Enter..."
            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          />
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition-colors">
            <MuiIcons.CheckCircle style={{ fontSize: 14 }} className="inline mr-1" />
            Habit
          </button>
          <button className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors">
            <MuiIcons.Assignment style={{ fontSize: 14 }} className="inline mr-1" />
            Task
          </button>
          <button className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors">
            <MuiIcons.Note style={{ fontSize: 14 }} className="inline mr-1" />
            Note
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertiesContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        View and edit properties of the selected item.
      </p>

      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 text-center">
        <MuiIcons.TouchApp style={{ fontSize: 32 }} className="text-slate-500 mb-2" />
        <p className="text-sm text-slate-500">
          Select an item to view its properties
        </p>
      </div>
    </div>
  );
}

export default RightDrawer;
