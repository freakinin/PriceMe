import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { SettingsDialog } from './SettingsDialog';

interface AppLayoutProps {
  children: ReactNode;
}

// Page titles mapping
import { NotificationBell } from './NotificationBell';

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') {
    return 'Home';
  }
  const titles: Record<string, string> = {
    '/products/add': 'Add New Product',
    '/products': 'Products',
    '/categories': 'Categories',
    '/materials': 'Materials',
    '/on-sale': 'On Sale',
    '/roadmap': 'Roadmap',
    '/market-analysis': 'Market Analysis',
  };
  return titles[pathname] || 'PriceMe';
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Close sidebar by default on Materials and Market Analysis pages
  const defaultOpen = !['/materials', '/market-analysis'].includes(location.pathname);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
          <SidebarTrigger />
          <div id="header-title" className="flex-1 flex items-center">
            {location.pathname !== '/market-analysis' && !location.pathname.includes('/edit') && location.pathname !== '/products/add' && (
              <h1 className="text-xl font-semibold">{pageTitle}</h1>
            )}
          </div>
          <div id="header-actions" className="ml-auto flex items-center gap-2">
          </div>
          <div className="flex items-center gap-2 pl-2">
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarProvider>
  );
}
