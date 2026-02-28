import { useState } from 'react';
import { BrainCircuit, RefreshCw, FileText, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoach } from '@/hooks/useCoach';
import { useSubscription } from '@/hooks/useSubscription';
import { CoachOnboarding } from '@/components/coach/CoachOnboarding';
import { HealthScoreWidget } from '@/components/coach/HealthScoreWidget';
import { InsightFeed } from '@/components/coach/InsightFeed';
import { ChatPanel } from '@/components/coach/ChatPanel';
import { ReportsPanel } from '@/components/coach/ReportsPanel';

export default function Coach() {
  const [showReports, setShowReports] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const {
    profile,
    isProfileLoading,
    upsertProfile,
    isUpsertingProfile,
    healthScore,
    insights,
    isInsightsLoading,
    generateInsights,
    isGeneratingInsights,
    updateInsightStatus,
    chatHistory,
    sendChat,
    isSendingChat,
    sendChatError,
    chatDailyUsed,
    reports,
    generateReport,
    isGeneratingReport,
  } = useCoach();

  const { subscription } = useSubscription();
  const limits = subscription?.limits;
  const planInsightLimit = limits?.coachInsights ?? 0;
  const planChatPerDay = limits?.coachChatPerDay ?? 0;
  const reportsPerMonthLimit = limits?.coachReportsPerMonth ?? 0;

  // While profile is loading, show a full-page skeleton
  if (isProfileLoading) {
    return (
      <div className="h-full p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show onboarding modal if no profile yet
  if (!profile) {
    return (
      <CoachOnboarding
        onComplete={async (data) => { await upsertProfile(data); }}
        isSubmitting={isUpsertingProfile}
      />
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Top action bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-muted-foreground">
            {profile.craft_type} · {
              profile.experience_years === '<1year' ? 'New seller' :
              profile.experience_years === '1-3years' ? '1–3 years exp.' : '3+ years exp.'
            }
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Edit profile"
            onClick={() => setEditingProfile(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReports((v) => !v)}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Reports
          </Button>
          <Button
            size="sm"
            onClick={() => generateInsights()}
            disabled={isGeneratingInsights || planInsightLimit === 0}
          >
            {isGeneratingInsights ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isGeneratingInsights ? 'Analyzing…' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      {/* Edit profile modal */}
      {editingProfile && (
        <CoachOnboarding
          initialValues={{
            craft_type: profile.craft_type,
            sales_channels: profile.sales_channels,
            experience_years: profile.experience_years as '<1year' | '1-3years' | '3+years',
            primary_challenge: profile.primary_challenge,
            monthly_revenue_goal: profile.monthly_revenue_goal ?? undefined,
          }}
          onComplete={async (data) => { await upsertProfile(data); }}
          isSubmitting={isUpsertingProfile}
          onCancel={() => setEditingProfile(false)}
        />
      )}

      {/* Reports panel — smooth slide-down using CSS grid-rows trick */}
      <div
        className="flex-shrink-0 overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ display: 'grid', gridTemplateRows: showReports ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <ReportsPanel
            reports={reports}
            onGenerate={generateReport}
            isGenerating={isGeneratingReport}
            onClose={() => setShowReports(false)}
            reportsPerMonthLimit={reportsPerMonthLimit}
          />
        </div>
      </div>

      {/* Main two-column body */}
      <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
        {/* Left column: Health score + Insight feed */}
        <div className="flex flex-col gap-5 p-6 overflow-y-auto" style={{ flex: '0 0 55%' }}>
          <HealthScoreWidget score={healthScore} />
          <InsightFeed
            insights={insights}
            isLoading={isInsightsLoading}
            isGenerating={isGeneratingInsights}
            onGenerate={() => generateInsights()}
            onStatusChange={updateInsightStatus}
            planInsightLimit={planInsightLimit}
          />
        </div>

        {/* Right column: Chat */}
        <div className="flex flex-col border-l overflow-hidden" style={{ flex: '0 0 45%' }}>
          <ChatPanel
            history={chatHistory}
            isSending={isSendingChat}
            error={sendChatError}
            onSend={sendChat}
            chatDailyUsed={chatDailyUsed}
            chatPerDayLimit={planChatPerDay}
          />
        </div>
      </div>
    </div>
  );
}
