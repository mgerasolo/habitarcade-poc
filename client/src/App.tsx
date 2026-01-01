import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './api';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Today } from './pages/Today';
import { Habits } from './pages/Habits';
import {
  ManageHabits,
  ManageCategories,
  ManageProjects,
  ManageTags,
  ManagePriorities,
  Settings,
} from './pages/Manage';
import { ModalManager } from './components/ModalManager';
import { useUIStore } from './stores';

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
    case 'manage-categories':
      return <ManageCategories />;
    case 'manage-projects':
      return <ManageProjects />;
    case 'manage-tags':
      return <ManageTags />;
    case 'manage-priorities':
      return <ManagePriorities />;
    case 'settings':
      return <Settings />;
    // Future pages can be added here
    case 'tasks':
    case 'projects':
    case 'analytics':
      // Placeholder - these pages can be implemented later
      return (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p>{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} page coming soon...</p>
        </div>
      );
    default:
      return <Today />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
