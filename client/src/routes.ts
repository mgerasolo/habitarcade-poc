import type { PageType } from './stores';

// Map PageType to URL paths
export const PAGE_ROUTES: Record<PageType, string> = {
  'dashboard': '/',
  'today': '/today',
  'habits': '/habits',
  'tasks': '/tasks',
  'kanban': '/kanban',
  'kanban-day': '/kanban/day',
  'kanban-status': '/kanban/status',
  'kanban-project': '/kanban/project',
  'kanban-category': '/kanban/category',
  'projects': '/projects',
  'analytics': '/analytics',
  'manage': '/manage',
  'manage-habits': '/manage/habits',
  'manage-categories': '/manage/categories',
  'manage-projects': '/manage/projects',
  'manage-tags': '/manage/tags',
  'manage-priorities': '/manage/priorities',
  'manage-quotes': '/manage/quotes',
  'manage-videos': '/manage/videos',
  'manage-tasks': '/manage/tasks',
  'manage-statuses': '/manage/statuses',
  'manage-icons': '/manage/icons',
  'settings': '/settings',
  'targets': '/targets',
  'time-blocks': '/time-blocks',
};

// Reverse mapping: URL path to PageType
export const ROUTE_TO_PAGE: Record<string, PageType> = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([page, route]) => [route, page as PageType])
);

// Get PageType from current URL path
export function getPageFromPath(pathname: string): PageType {
  return ROUTE_TO_PAGE[pathname] || 'dashboard';
}
