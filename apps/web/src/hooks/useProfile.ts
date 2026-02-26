import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ProfileData {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileData> => {
      const response = await api.get('/profile');
      if (response.data.status === 'success') return response.data.data;
      throw new Error('Failed to load profile');
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.patch('/profile', { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.post('/profile/change-password', data);
      return response.data;
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    updateName: updateNameMutation.mutateAsync,
    isUpdatingName: updateNameMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}
