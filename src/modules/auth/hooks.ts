import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('cashierToken', data.tokens.accessToken);
      queryClient.setQueryData(['cashier'], data.user);
    }
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['cashier'],
    queryFn: async () => {
      const token = localStorage.getItem('cashierToken');
      if (!token) return null;
      try {
        const { data } = await api.get('/auth/me');
        return data.user;
      } catch (err) {
        localStorage.removeItem('cashierToken');
        return null;
      }
    },
    retry: false
  });
}
