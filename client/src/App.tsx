import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
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
  Settings,
} from './pages/Manage';
import { Targets } from './pages/Targets';
import { TimeBlocks } from './pages/TimeBlocks';
import { ModalManager } from './components/ModalManager';
import { useUIStore } from './stores';
import { PAGE_ROUTES, getPageFromPath } from './routes';

// Sync URL with store state (prevents infinite loop with ref tracking)
function RouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPage, setCurrentPage } = useUIStore();

  // Track what caused the last change to prevent ping-pong loops
  const lastSyncSource = useRef<'url' | 'store' | null>(null);

  // When URL changes (e.g., browser back/forward, new tab), sync to store
  useEffect(() => {
    // Skip if we just synced from store to URL
    if (lastSyncSource.current === 'store') {
      lastSyncSource.current = null;
      return;
    }

    const pageFromUrl = getPageFromPath(location.pathname);
    if (pageFromUrl !== currentPage) {
      lastSyncSource.current = 'url';
      setCurrentPage(pageFromUrl);
    }
  }, [location.pathname, currentPage, setCurrentPage]);

  // When store changes (e.g., sidebar click), sync to URL
  useEffect(() => {
    // Skip if we just synced from URL to store
    if (lastSyncSource.current === 'url') {
      lastSyncSource.current = null;
      return;
    }

    const expectedPath = PAGE_ROUTES[currentPage];
    if (location.pathname !== expectedPath) {
      lastSyncSource.current = 'store';
      navigate(expectedPath, { replace: false });
    }
  }, [currentPage, location.pathname, navigate]);

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
    case 'settings':
      return <Settings />;
    case 'targets':
      return <Targets />;
    case 'time-blocks':
      return <TimeBlocks />;
    // Future pages can be added here
    case 'tasks':
    case 'kanban-status':
    case 'kanban-project':
    case 'kanban-category':
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
