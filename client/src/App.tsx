import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClickToComponent } from 'click-to-react-component';
import { queryClient } from './api';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Today } from './pages/Today';
import { Habits } from './pages/Habits';
import {
  ManageHabits,
  ManageTasks,
  ManageCategories,
  ManageProjects,
  ManageTags,
  ManagePriorities,
  ManageQuotes,
  ManageVideos,
  ManageStatuses,
  Settings,
} from './pages/Manage';
import { Targets } from './pages/Targets';
import { TimeBlocks } from './pages/TimeBlocks';
import { StatusView, CategoryView } from './pages/Kanban';
import { ModalManager } from './components/ModalManager';
import { useUIStore } from './stores';
import { getPageFromPath } from './routes';

// Sync URL with store state - only syncs URL changes to store (for browser back/forward)
// Store-to-URL navigation is handled directly by components using useNavigate
function RouteSync() {
  const location = useLocation();
  const { currentPage, setCurrentPage } = useUIStore();

  // Sync URL to store when pathname changes (browser back/forward, direct URL entry)
  useEffect(() => {
    const pageFromUrl = getPageFromPath(location.pathname);
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [location.pathname, setCurrentPage]); // Note: currentPage intentionally excluded to prevent loops

  return null;
}

function PageRouter() {
  const { currentPage } = useUIStore();

  switch (currentPage) {
    case 'today':
      return <Today />;
    case 'dashboard':
      return <Dashboard />;
    case 'habits':
      return <Habits />;
    // Manage section pages
    case 'manage-habits':
      return <ManageHabits />;
    case 'manage-tasks':
      return <ManageTasks />;
    case 'manage-categories':
      return <ManageCategories />;
    case 'manage-projects':
      return <ManageProjects />;
    case 'manage-tags':
      return <ManageTags />;
    case 'manage-priorities':
      return <ManagePriorities />;
    case 'manage-quotes':
      return <ManageQuotes />;
    case 'manage-videos':
      return <ManageVideos />;
    case 'manage-statuses':
      return <ManageStatuses />;
    case 'settings':
      return <Settings />;
    case 'targets':
      return <Targets />;
    case 'time-blocks':
      return <TimeBlocks />;
    // Kanban views
    case 'kanban-status':
      return <StatusView />;
    case 'kanban-category':
      return <CategoryView />;
    // Future pages can be added here
    case 'tasks':
    case 'kanban-project':
    case 'projects':
    case 'analytics':
      // Placeholder - these pages can be implemented later
      return (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} page coming soon...</p>
        </div>
      );
    default:
      return <Dashboard />;
  }
}

function AppContent() {
  return (
    <>
      <RouteSync />
      <ClickToComponent />
      <Layout>
        <PageRouter />
      </Layout>
      <ModalManager />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          },
          success: {
            iconTheme: {
              primary: '#14b8a6',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
