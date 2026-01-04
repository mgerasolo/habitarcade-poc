import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Custom Icon - user-added icon codes
 */
export interface CustomIcon {
  id: string;
  code: string; // e.g., "material:Home", "fa-solid fa-check"
  label: string; // User-friendly name
  createdAt: string;
}

/**
 * Recent Icon - recently used icons
 */
export interface RecentIcon {
  code: string;
  color?: string;
  usedAt: string;
}

/**
 * Uploaded Image - user-uploaded images stored as data URLs
 */
export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string; // Base64 data URL
  size: number; // File size in bytes
  createdAt: string;
}

interface IconsStore {
  // State
  customIcons: CustomIcon[];
  recentIcons: RecentIcon[];
  uploadedImages: UploadedImage[];

  // Custom icon actions
  addCustomIcon: (code: string, label: string) => void;
  removeCustomIcon: (id: string) => void;
  updateCustomIcon: (id: string, updates: Partial<CustomIcon>) => void;

  // Recent icons actions
  addRecentIcon: (code: string, color?: string) => void;
  clearRecentIcons: () => void;

  // Uploaded images actions
  addUploadedImage: (name: string, dataUrl: string, size: number) => void;
  removeUploadedImage: (id: string) => void;
}

// Maximum number of recent icons to keep
const MAX_RECENT_ICONS = 20;

// Maximum number of uploaded images (to prevent localStorage bloat)
const MAX_UPLOADED_IMAGES = 50;

export const useIconsStore = create<IconsStore>()(
  persist(
    (set) => ({
      // Initial state
      customIcons: [],
      recentIcons: [],
      uploadedImages: [],

      // Add custom icon
      addCustomIcon: (code, label) => {
        const newIcon: CustomIcon = {
          id: crypto.randomUUID(),
          code,
          label,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customIcons: [...state.customIcons, newIcon],
        }));
      },

      // Remove custom icon
      removeCustomIcon: (id) => {
        set((state) => ({
          customIcons: state.customIcons.filter((icon) => icon.id !== id),
        }));
      },

      // Update custom icon
      updateCustomIcon: (id, updates) => {
        set((state) => ({
          customIcons: state.customIcons.map((icon) =>
            icon.id === id ? { ...icon, ...updates } : icon
          ),
        }));
      },

      // Add to recent icons
      addRecentIcon: (code, color) => {
        set((state) => {
          // Remove existing entry with same code
          const filtered = state.recentIcons.filter((r) => r.code !== code);

          // Add to front
          const newRecent: RecentIcon = {
            code,
            color,
            usedAt: new Date().toISOString(),
          };

          // Keep only MAX_RECENT_ICONS
          const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_ICONS);

          return { recentIcons: updated };
        });
      },

      // Clear recent icons
      clearRecentIcons: () => {
        set({ recentIcons: [] });
      },

      // Add uploaded image
      addUploadedImage: (name, dataUrl, size) => {
        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          name,
          dataUrl,
          size,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          // Keep only MAX_UPLOADED_IMAGES (remove oldest first)
          const updated = [...state.uploadedImages, newImage].slice(-MAX_UPLOADED_IMAGES);
          return { uploadedImages: updated };
        });
      },

      // Remove uploaded image
      removeUploadedImage: (id) => {
        set((state) => ({
          uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
        }));
      },
    }),
    {
      name: 'habitarcade-icons',
    }
  )
);
