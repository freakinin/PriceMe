import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openSettingsAt } from '@/lib/openSettings';

interface CoachGateProps {
  feature: 'chat' | 'reports' | 'insights';
  message: string;
}

export function CoachGate({ feature: _feature, message }: CoachGateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 p-8 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{message}</p>
        <p className="text-xs text-muted-foreground">Upgrade your plan to unlock this feature.</p>
      </div>
      <Button size="sm" onClick={() => openSettingsAt('subscription')}>
        <Zap className="h-3.5 w-3.5 mr-1.5" />
        Upgrade Plan
      </Button>
    </div>
  );
}
