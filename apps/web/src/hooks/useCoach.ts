import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  CoachProfile,
  CoachInsight,
  CoachChatMessage,
  CoachReport,
  HealthScore,
  ReportType,
} from '@priceme/shared';

export type { CoachProfile, CoachInsight, CoachChatMessage, CoachReport, HealthScore, ReportType };

export function useCoach() {
  const queryClient = useQueryClient();

  // ─── Profile ──────────────────────────────────────────────────────────────

  const profileQuery = useQuery({
    queryKey: ['coach', 'profile'],
    queryFn: async (): Promise<CoachProfile | null> => {
      const response = await api.get('/coach/profile');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load coach profile');
    },
  });

  const upsertProfileMutation = useMutation({
    mutationFn: async (data: {
      craft_type: string;
      sales_channels: string[];
      experience_years: '<1year' | '1-3years' | '3+years';
      primary_challenge: string;
      monthly_revenue_goal?: number;
    }) => {
      const response = await api.post('/coach/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'profile'] });
    },
  });

  // ─── Health Score ─────────────────────────────────────────────────────────

  const healthScoreQuery = useQuery({
    queryKey: ['coach', 'health-score'],
    queryFn: async (): Promise<HealthScore> => {
      const response = await api.get('/coach/health-score');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load health score');
    },
    enabled: !!profileQuery.data,
  });

  // ─── Insights ─────────────────────────────────────────────────────────────

  const insightsQuery = useQuery({
    queryKey: ['coach', 'insights'],
    queryFn: async (): Promise<CoachInsight[]> => {
      const response = await api.get('/coach/insights');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load insights');
    },
    enabled: !!profileQuery.data,
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/coach/insights/generate');
      return response.data.data as CoachInsight[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['coach', 'insights'], data);
      queryClient.invalidateQueries({ queryKey: ['coach', 'health-score'] });
    },
  });

  const updateInsightStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'read' | 'dismissed' | 'done' }) => {
      const response = await api.patch(`/coach/insights/${id}`, { status });
      return response.data;
    },
    onSuccess: (_data, { id, status }) => {
      queryClient.setQueryData<CoachInsight[]>(['coach', 'insights'], (old) =>
        old
          ? status === 'dismissed'
            ? old.filter((i) => i.id !== id)          // dismissed → remove
            : old.map((i) => (i.id === id ? { ...i, status } : i)) // done/read → update in place
          : old
      );
    },
  });

  // ─── Chat ─────────────────────────────────────────────────────────────────

  const chatHistoryQuery = useQuery({
    queryKey: ['coach', 'chat-history'],
    queryFn: async (): Promise<CoachChatMessage[]> => {
      const response = await api.get('/coach/chat/history');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load chat history');
    },
    enabled: !!profileQuery.data,
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ message, session_id }: { message: string; session_id: string }) => {
      const response = await api.post('/coach/chat', { message, session_id });
      if (response.data.status === 'success') return response.data.data as CoachChatMessage;
      throw new Error(response.data.message || 'Failed to send message');
    },
    onMutate: async ({ message, session_id }) => {
      // Show the user's message immediately — don't wait for the AI response
      const optimisticUserMsg: CoachChatMessage = {
        id: Date.now(),
        user_id: 0,
        role: 'user',
        content: message,
        session_id,
        created_at: new Date(),
      };
      queryClient.setQueryData<CoachChatMessage[]>(['coach', 'chat-history'], (old) => [
        ...(old ?? []),
        optimisticUserMsg,
      ]);
    },
    onSuccess: (assistantMessage) => {
      // Append the assistant reply — user message is already in the cache
      queryClient.setQueryData<CoachChatMessage[]>(['coach', 'chat-history'], (old) => [
        ...(old ?? []),
        assistantMessage,
      ]);
    },
    onError: () => {
      // Roll back the optimistic user message on failure
      queryClient.invalidateQueries({ queryKey: ['coach', 'chat-history'] });
    },
  });

  // ─── Reports ──────────────────────────────────────────────────────────────

  const reportsQuery = useQuery({
    queryKey: ['coach', 'reports'],
    queryFn: async (): Promise<CoachReport[]> => {
      const response = await api.get('/coach/reports');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load reports');
    },
    enabled: !!profileQuery.data,
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({
      report_type,
      force_regenerate,
    }: {
      report_type: ReportType;
      force_regenerate?: boolean;
    }) => {
      const response = await api.post('/coach/reports/generate', { report_type, force_regenerate });
      if (response.data.status === 'success') return response.data.data as CoachReport;
      throw new Error(response.data.message || 'Failed to generate report');
    },
    onSuccess: (newReport) => {
      queryClient.setQueryData<CoachReport[]>(['coach', 'reports'], (old) => {
        if (!old) return [newReport];
        const exists = old.find((r) => r.report_type === newReport.report_type);
        return exists
          ? old.map((r) => (r.report_type === newReport.report_type ? newReport : r))
          : [...old, newReport];
      });
    },
  });

  // ─── Derived state ────────────────────────────────────────────────────────

  const todayMessages = (chatHistoryQuery.data ?? []).filter((m) => {
    const today = new Date();
    const msgDate = new Date(m.created_at);
    return (
      m.role === 'user' &&
      msgDate.getFullYear() === today.getFullYear() &&
      msgDate.getMonth() === today.getMonth() &&
      msgDate.getDate() === today.getDate()
    );
  }).length;

  return {
    // Profile
    profile: profileQuery.data ?? null,
    isProfileLoading: profileQuery.isLoading,
    upsertProfile: upsertProfileMutation.mutateAsync,
    isUpsertingProfile: upsertProfileMutation.isPending,

    // Health score
    healthScore: healthScoreQuery.data ?? null,
    isHealthScoreLoading: healthScoreQuery.isLoading,

    // Insights
    insights: insightsQuery.data ?? [],
    isInsightsLoading: insightsQuery.isLoading,
    generateInsights: generateInsightsMutation.mutateAsync,
    isGeneratingInsights: generateInsightsMutation.isPending,
    updateInsightStatus: updateInsightStatusMutation.mutateAsync,

    // Chat
    chatHistory: chatHistoryQuery.data ?? [],
    isChatHistoryLoading: chatHistoryQuery.isLoading,
    sendChat: sendChatMutation.mutateAsync,
    isSendingChat: sendChatMutation.isPending,
    sendChatError: sendChatMutation.error ? (sendChatMutation.error as Error).message : null,
    chatDailyUsed: todayMessages,

    // Reports
    reports: reportsQuery.data ?? [],
    isReportsLoading: reportsQuery.isLoading,
    generateReport: generateReportMutation.mutateAsync,
    isGeneratingReport: generateReportMutation.isPending,
  };
}
