import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

// Page titles mapping - will get user name dynamically
const getPageTitle = (pathname: string, userName?: string): string => {
  if (pathname === '/') {
    return `Hi ${userName || 'Amir'}`;
  }
  const titles: Record<string, string> = {
    '/products/add': 'Create Product',
    '/products': 'Products',
    '/materials': 'Materials',
    '/on-sale': 'On Sale',
    '/settings': 'Settings',
    '/roadmap': 'Roadmap',
  };
  return titles[pathname] || 'PriceMe';
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const pageTitle = getPageTitle(location.pathname, user?.name);
  
  // Close sidebar by default on Materials page
  const defaultOpen = location.pathname !== '/materials';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}

