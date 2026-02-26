import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: 'products' | 'competitors';
  currentLimit: number;
  onViewPlans: () => void;
}

const RESOURCE_LABELS: Record<UpgradePromptProps['resource'], string> = {
  products: 'products',
  competitors: 'tracked competitor products',
};

export function UpgradePrompt({ open, onOpenChange, resource, currentLimit, onViewPlans }: UpgradePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
              <Zap className="h-4 w-4 text-secondary-foreground" />
            </div>
            <DialogTitle>Plan Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Your current plan allows up to <strong>{currentLimit}</strong>{' '}
            {RESOURCE_LABELS[resource]}. Upgrade to add more.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onViewPlans();
            }}
          >
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
