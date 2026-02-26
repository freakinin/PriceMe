import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Ruler,
  ShoppingBag,
  Truck,
  User,
  CreditCard,
  BarChart3,
  Layers,
} from 'lucide-react';
import { FinancialSettings } from './settings/FinancialSettings';
import { MeasurementSettings } from './settings/MeasurementSettings';
import { PlatformFeesSettings } from './settings/PlatformFeesSettings';
import { ShippingSettings } from './settings/ShippingSettings';
import { ComingSoonSection } from './settings/ComingSoonSection';
import { SubscriptionSettings } from './settings/SubscriptionSettings';
import { UsageSettings } from './settings/UsageSettings';

type Section =
  | 'financial'
  | 'measurements'
  | 'platform-fees'
  | 'shipping'
  | 'profile'
  | 'billing'
  | 'usage'
  | 'subscription';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  description?: string;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'My Business',
    items: [
      { id: 'financial', label: 'Financial', icon: DollarSign },
      { id: 'measurements', label: 'Measurements', icon: Ruler },
    ],
  },
  {
    label: 'Selling',
    items: [
      { id: 'platform-fees', label: 'Platform Fees', icon: ShoppingBag },
      { id: 'shipping', label: 'Shipping', icon: Truck },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        comingSoon: true,
        description: 'Manage your account profile, email, and password.',
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: CreditCard,
        comingSoon: true,
        description: 'View and manage your billing information and payment methods.',
      },
      {
        id: 'usage',
        label: 'Usage',
        icon: BarChart3,
        description: 'Track your usage statistics and limits.',
      },
      {
        id: 'subscription',
        label: 'Subscription',
        icon: Layers,
        description: 'Manage your subscription plan and features.',
      },
    ],
  },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: Section;
}

export function SettingsDialog({ open, onOpenChange, initialSection }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<Section>(initialSection ?? 'financial');

  const activeItem = NAV_GROUPS.flatMap((g) => g.items).find((item) => item.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case 'financial':
        return <FinancialSettings />;
      case 'measurements':
        return <MeasurementSettings />;
      case 'platform-fees':
        return <PlatformFeesSettings />;
      case 'shipping':
        return <ShippingSettings />;
      case 'subscription':
        return <SubscriptionSettings />;
      case 'usage':
        return <UsageSettings onViewSubscription={() => setActiveSection('subscription')} />;
      default:
        return (
          <ComingSoonSection
            title={activeItem?.label ?? 'Coming Soon'}
            description={activeItem?.description}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar navigation */}
          <nav className="w-56 border-r overflow-y-auto flex-shrink-0 p-3 space-y-1">
            {NAV_GROUPS.map((group, groupIndex) => (
              <div key={group.label}>
                {groupIndex > 0 && <Separator className="my-2" />}
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full justify-start gap-2 h-8 px-2 font-normal',
                        activeSection === item.id &&
                          'bg-accent text-accent-foreground font-medium'
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.comingSoon && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0 h-4 leading-none"
                        >
                          Soon
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Right content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
