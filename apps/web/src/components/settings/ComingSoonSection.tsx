import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComingSoonSectionProps {
  title: string;
  description?: string;
}

export function ComingSoonSection({ title, description }: ComingSoonSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4 p-8">
      <div className="rounded-full bg-muted p-4">
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
        )}
      </div>
      <Badge variant="secondary">Coming Soon</Badge>
    </div>
  );
}
