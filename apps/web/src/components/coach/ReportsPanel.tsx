import { useState } from 'react';
import { RefreshCw, X, FileText, TrendingUp, DollarSign, Scissors, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoachGate } from './CoachGate';
import { cn } from '@/lib/utils';
import type { CoachReport, ReportType } from '@/hooks/useCoach';

interface ReportsPanelProps {
  reports: CoachReport[];
  onGenerate: (args: { report_type: ReportType; force_regenerate?: boolean }) => Promise<CoachReport>;
  isGenerating: boolean;
  onClose: () => void;
  reportsPerMonthLimit: number; // 0 = no access
}

const REPORT_META: Record<ReportType, { label: string; description: string; icon: React.ElementType; color: string }> = {
  portfolio_analysis: {
    label: 'Portfolio Analysis',
    description: 'Ranks every product. Tells you what to scale, fix, or cut.',
    icon: TrendingUp,
    color: 'text-blue-500',
  },
  pricing_audit: {
    label: 'Pricing Audit',
    description: 'Flags underpriced products and missed margin opportunities.',
    icon: DollarSign,
    color: 'text-green-500',
  },
  cost_reduction: {
    label: 'Cost Reduction',
    description: 'Identifies your biggest cost drivers and how to cut them.',
    icon: Scissors,
    color: 'text-orange-500',
  },
  revenue_goal_path: {
    label: 'Revenue Goal Path',
    description: 'Shows exactly how to hit your monthly revenue target.',
    icon: Target,
    color: 'text-purple-500',
  },
};

const REPORT_TYPES = Object.keys(REPORT_META) as ReportType[];

function renderMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-4 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function ReportsPanel({
  reports,
  onGenerate,
  isGenerating,
  onClose,
  reportsPerMonthLimit,
}: ReportsPanelProps) {
  const [activeType, setActiveType] = useState<ReportType>('portfolio_analysis');
  const [generating, setGenerating] = useState<ReportType | null>(null);

  const getReport = (type: ReportType) => reports.find(r => r.report_type === type);
  const activeReport = getReport(activeType);
  const activeMeta = REPORT_META[activeType];
  const ActiveIcon = activeMeta.icon;

  const handleGenerate = async (type: ReportType, force = false) => {
    setGenerating(type);
    try {
      await onGenerate({ report_type: type, force_regenerate: force });
      setActiveType(type);
    } finally {
      setGenerating(null);
    }
  };

  if (reportsPerMonthLimit === 0) {
    return (
      <div className="relative border rounded-xl bg-card p-4">
        <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <CoachGate feature="reports" message="Deep-dive reports require Starter plan or higher." />
      </div>
    );
  }

  return (
    <div className="border-b bg-card shadow-md">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Deep-Dive Reports</span>
          <span className="text-xs text-muted-foreground">— AI-generated analysis of your shop</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex" style={{ height: '340px' }}>
        {/* Report type sidebar */}
        <div className="w-52 border-r flex-shrink-0 overflow-y-auto bg-muted/20">
          {REPORT_TYPES.map((type) => {
            const meta = REPORT_META[type];
            const report = getReport(type);
            const Icon = meta.icon;
            const isGeneratingThis = generating === type;
            const isActive = activeType === type;

            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  'w-full text-left px-4 py-3 transition-colors border-b last:border-b-0',
                  isActive
                    ? 'bg-background border-l-2 border-l-primary'
                    : 'hover:bg-muted/60 border-l-2 border-l-transparent',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', meta.color)} />
                  <span className={cn('font-medium text-xs', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                    {meta.label}
                  </span>
                  {report && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
                      Ready
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight pl-5">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Report content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content header */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <ActiveIcon className={cn('h-4 w-4', activeMeta.color)} />
              <span className="text-sm font-medium">{activeMeta.label}</span>
              {activeReport && (
                <span className="text-xs text-muted-foreground">
                  · {new Date(activeReport.generated_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant={activeReport ? 'outline' : 'default'}
              className="h-7 text-xs px-3"
              disabled={generating === activeType}
              onClick={() => handleGenerate(activeType, !!activeReport)}
            >
              {generating === activeType ? (
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <FileText className="h-3 w-3 mr-1.5" />
              )}
              {generating === activeType ? 'Generating…' : activeReport ? 'Regenerate' : 'Generate'}
            </Button>
          </div>

          {/* Content body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!activeReport ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className={cn('h-10 w-10 rounded-full flex items-center justify-center bg-muted')}>
                  <ActiveIcon className={cn('h-5 w-5', activeMeta.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium">{activeMeta.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
                    {activeMeta.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="mt-1"
                  disabled={generating === activeType}
                  onClick={() => handleGenerate(activeType, false)}
                >
                  {generating === activeType ? (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {generating === activeType ? 'Generating…' : 'Generate Report'}
                </Button>
              </div>
            ) : (
              <div
                className="text-sm leading-relaxed space-y-1"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(activeReport.content) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
