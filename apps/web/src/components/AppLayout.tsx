import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { SettingsDialog } from './SettingsDialog';
import { NotificationBell } from './NotificationBell';
import { useSubscription } from '@/hooks/useSubscription';
import { openSettingsAt } from '@/lib/openSettings';

interface AppLayoutProps {
  children: ReactNode;
}

// Page titles mapping

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
    '/coach': 'Coach',
  };
  return titles[pathname] || 'Cravio';
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'subscription' | undefined>(undefined);
  const { isAtLimit } = useSubscription();
  const hasLimitReached = isAtLimit('products') || isAtLimit('competitors');

  // Listen for open-settings events dispatched by child pages (e.g. UpgradePrompt)
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent<{ section?: 'subscription' }>).detail?.section;
      setSettingsSection(section);
      setSettingsOpen(true);
    };
    window.addEventListener('open-settings', handler);
    return () => window.removeEventListener('open-settings', handler);
  }, []);

  // Close sidebar by default on Materials and Market Analysis pages
  const defaultOpen = !['/materials', '/market-analysis'].includes(location.pathname);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center gap-3 border-b border-border bg-background/90 backdrop-blur-sm px-5 sticky top-0 z-20">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors shrink-0" />
          <div id="header-title" className="flex-1 flex items-center min-w-0">
            {location.pathname !== '/market-analysis' && !location.pathname.includes('/edit') && location.pathname !== '/products/add' && (
              <h1 className="text-sm font-semibold text-foreground/80 truncate">{pageTitle}</h1>
            )}
          </div>
          <div id="header-actions" className="flex items-center gap-2">
          </div>
          <div className="flex items-center gap-2">
            {hasLimitReached && (
              <button
                onClick={() => openSettingsAt('subscription')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="hidden sm:inline">Plan limit reached</span>
              </button>
            )}
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialSection={settingsSection}
      />
    </SidebarProvider>
  );
}
