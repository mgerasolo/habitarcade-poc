import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RightSidebar } from './RightSidebar';
import { useUIStore } from '../../stores';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarOpen, rightSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <Header />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`
            flex-1 transition-all duration-300 ease-in-out
            pt-4 px-4 pb-6 min-w-0
            ${sidebarOpen ? 'ml-56' : 'ml-14'}
            ${rightSidebarOpen ? 'mr-80' : ''}
          `}
        >
          <div className="w-full">
            {children}
          </div>
        </main>
        <RightSidebar isOpen={rightSidebarOpen} />
      </div>
    </div>
  );
}

export default Layout;
