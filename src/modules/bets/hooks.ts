import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useMyPlacedBets() {
  return useQuery({
    queryKey: ["cashier-bets"],
    queryFn: async () => {
      const { data } = await api.get("/betslips/mine");
      return data.slips;
    }
  });
}

export function useCashierBetStats(date?: string) {
  const effectiveDate = date || new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["cashier-stats", effectiveDate],
    queryFn: async () => {
      const { data } = await api.get(`/cashier/stats`, { params: { date: effectiveDate } });
      return data;
    },
  });
}

export function useCreateSlip() {
  return useMutation({
    mutationFn: async ({ userId }: { userId?: string } = {}) => {
      const { data } = await api.post("/betslips", userId ? { userId } : {});
      return data.slip;
    }
  });
}

export function useSlip(slipId?: string | null) {
  return useQuery({
    queryKey: ["cashier-slip", slipId],
    enabled: !!slipId,
    staleTime: 15_000,
    queryFn: async () => {
      const { data } = await api.get(`/betslips/${slipId}`);
      return data.slip;
    }
  });
}

export function useAddSelection() {
  return useMutation({
    mutationFn: async ({ slipId, outcomeId }: { slipId: string; outcomeId: string }) => {
      const { data } = await api.post("/betslips/selection", { slipId, outcomeId });
      return data.slip;
    }
  });
}

export function useBulkUpsertSelections() {
  return useMutation({
    mutationFn: async (payload: {
      slipId: string;
      selections: Array<{ outcomeId: string; acceptedOdds: number; acceptedOddsVersion: number }>;
    }) => {
      const { data } = await api.post("/betslips/selections/bulk", payload);
      return data.data;
    },
  });
}

export function usePlaceSlip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slipId, stake }: { slipId: string; stake: number }) => {
      const { data } = await api.post("/betslips/place", { slipId, stake });
      return data.slip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-limit"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-bets"] });
    }
  });
}
