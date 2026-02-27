import { useState } from 'react';
import { RefreshCw, X, FileText } from 'lucide-react';
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

const REPORT_META: Record<ReportType, { label: string; description: string }> = {
  portfolio_analysis: {
    label: 'Portfolio Analysis',
    description: 'Ranks every product. Tells you what to scale, fix, or cut.',
  },
  pricing_audit: {
    label: 'Pricing Audit',
    description: 'Flags underpriced products and missed margin opportunities.',
  },
  cost_reduction: {
    label: 'Cost Reduction',
    description: 'Identifies your biggest cost drivers and how to cut them.',
  },
  revenue_goal_path: {
    label: 'Revenue Goal Path',
    description: 'Shows exactly how to hit your monthly revenue target.',
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
    <div className="border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <p className="text-sm font-semibold">Deep-Dive Reports</p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex min-h-[360px]">
        {/* Report type list */}
        <div className="w-56 border-r flex-shrink-0 p-2 space-y-1">
          {REPORT_TYPES.map((type) => {
            const meta = REPORT_META[type];
            const report = getReport(type);
            const isGeneratingThis = generating === type || (isGenerating && generating === null);
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm',
                  activeType === type ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-xs">{meta.label}</span>
                  {report && <Badge variant="outline" className="text-[9px] px-1 py-0">Ready</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{meta.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 px-2 text-[11px] w-full"
                  disabled={isGeneratingThis}
                  onClick={(e) => { e.stopPropagation(); handleGenerate(type, !!report); }}
                >
                  {isGeneratingThis && generating === type ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  {report ? 'Regenerate' : 'Generate'}
                </Button>
              </button>
            );
          })}
        </div>

        {/* Report content */}
        <div className="flex-1 p-5 overflow-y-auto max-h-[500px]">
          {!activeReport ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 opacity-30" />
              <p>Generate this report to see your analysis.</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-[11px] text-muted-foreground mb-4">
                Generated {new Date(activeReport.generated_at).toLocaleDateString()}
              </p>
              <div
                className="text-sm leading-relaxed space-y-1"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(activeReport.content) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
