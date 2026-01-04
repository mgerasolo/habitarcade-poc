import { useEffect, useRef } from 'react';
import * as MuiIcons from '@mui/icons-material';
import type { Project } from '../../types';

interface ProjectContextMenuProps {
  projects: Project[];
  position: { x: number; y: number };
  onSelect: (projectId: string) => void;
  onClose: () => void;
}

/**
 * ProjectContextMenu - Dropdown menu for selecting a project
 *
 * Displays projects alphabetically with 24x24 icons
 */
export function ProjectContextMenu({
  projects,
  position,
  onSelect,
  onClose,
}: ProjectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Sort projects alphabetically
  const sortedProjects = [...projects]
    .filter(p => !p.isDeleted)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 220),
    y: Math.min(position.y, window.innerHeight - (sortedProjects.length * 36 + 20)),
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] py-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl shadow-black/30"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 text-xs text-slate-400 font-medium border-b border-slate-700/50">
        Move to Project
      </div>

      {/* Project list */}
      <div className="max-h-[300px] overflow-y-auto py-1">
        {sortedProjects.length === 0 ? (
          <div className="px-3 py-2 text-sm text-slate-500 italic">
            No projects available
          </div>
        ) : (
          sortedProjects.map((project) => (
            <ProjectMenuItem
              key={project.id}
              project={project}
              onSelect={() => onSelect(project.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ProjectMenuItemProps {
  project: Project;
  onSelect: () => void;
}

function ProjectMenuItem({ project, onSelect }: ProjectMenuItemProps) {
  const iconColor = project.color || project.iconColor || '#6366f1';

  // Get the icon component
  const IconComponent = project.icon
    ? (MuiIcons[project.icon as keyof typeof MuiIcons] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>)
    : MuiIcons.Folder;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors"
    >
      {/* Project icon - 24x24 */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <IconComponent
            style={{ color: iconColor, fontSize: 20 }}
            className="w-5 h-5"
          />
        )}
      </div>

      {/* Project name */}
      <span className="text-sm text-slate-200 truncate">
        {project.name}
      </span>
    </button>
  );
}

export default ProjectContextMenu;
