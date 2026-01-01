import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RightDrawer } from './RightDrawer';
import { useUIStore } from '../../stores';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarOpen, rightDrawerOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <Header />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`
            flex-1 transition-all duration-300 ease-in-out
            pt-4 px-4 pb-6
            ${sidebarOpen ? 'ml-64' : 'ml-16'}
            ${rightDrawerOpen ? 'mr-80' : 'mr-0'}
          `}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <RightDrawer isOpen={rightDrawerOpen} />
      </div>
    </div>
  );
}

export default Layout;
