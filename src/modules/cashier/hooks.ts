import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useCashierLimit() {
  return useQuery({
    queryKey: ['cashier-limit'],
    queryFn: async () => {
      const { data } = await api.get('/limits/me');
      return data.limit;
    }
  });
}

export function useSearchPlayer(query: string) {
  return useQuery({
    queryKey: ['search-player', query],
    queryFn: async () => {
      if (!query) return null;
      // We assume there's an endpoint to find a user by phone/ID
      const { data } = await api.get(`/users/search?q=${query}`);
      return data.user;
    },
    enabled: false // Triggered manually
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data } = await api.post('/limits/deposit', { userId, amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-limit'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-stats'] });
      queryClient.invalidateQueries({ queryKey: ['search-player'] });
    }
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const { data } = await api.post('/cashier/withdrawals/redeem-token', { token });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-limit'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-stats'] });
      queryClient.invalidateQueries({ queryKey: ['search-player'] });
    },
  });
}

export function usePaySlip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slipId }: { slipId: string }) => {
      const { data } = await api.post("/cashier/payouts/pay", { slipId });
      return data.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-limit"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-bets"] });
    },
  });
}
