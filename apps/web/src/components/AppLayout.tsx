import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, HelpCircle, Gift } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { SettingsDialog } from './SettingsDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { openSettingsAt } from '@/lib/openSettings';
import { TourProvider } from './onboarding/TourContext';
import { AppTour } from './onboarding/AppTour';

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
  const { isAtLimit, subscription } = useSubscription();
  const hasLimitReached = isAtLimit('products') || isAtLimit('competitors');

  // Trial expiry banner — show 14 days before trial ends
  const trialEndsAt    = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const trialDaysLeft  = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 14;
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);

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

  // Pages that have a contextual tour
  const hasTour =
    location.pathname === '/' ||
    location.pathname === '/products/add' ||
    location.pathname === '/coach' ||
    location.pathname.startsWith('/market-analysis');

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TourProvider>
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
              {hasTour && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('start-page-tour', { detail: { path: location.pathname } }))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
                  title="Show walkthrough"
                  aria-label="Show page walkthrough"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {/* Trial expiry banner — appears 14 days before end */}
          {showTrialBanner && !trialBannerDismissed && (
            <div className="flex items-center gap-2 px-5 py-2 bg-brand-100 border-b border-brand-500/20 text-xs text-brand-900">
              <Gift className="h-3.5 w-3.5 text-brand-700 shrink-0" />
              <span className="flex-1">
                Your free Pro trial ends in <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'}</strong>.
              </span>
              <button
                onClick={() => openSettingsAt('subscription')}
                className="font-semibold text-brand-700 hover:text-brand-900 underline underline-offset-2 shrink-0"
              >
                Upgrade to keep it →
              </button>
              <button
                onClick={() => setTrialBannerDismissed(true)}
                className="ml-2 text-brand-500 hover:text-brand-700 shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto">{children}</div>
        </main>
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          initialSection={settingsSection}
        />
        <AppTour />
      </TourProvider>
    </SidebarProvider>
  );
}
