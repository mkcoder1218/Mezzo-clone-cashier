import { useMutation, useQuery } from "@tanstack/react-query";
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

export function useCashierBetStats() {
  return useQuery({
    queryKey: ["cashier-bet-stats"],
    queryFn: async () => {
      const { data } = await api.get("/betslips/mine");
      const slips = data.slips || [];
      const count = slips.length;
      const amount = slips.reduce((sum: number, s: any) => sum + Number(s?.stake || 0), 0);
      // Revenue definition (for now): total stakes placed by this cashier.
      // If payout tracking is added, this can evolve to stakes - payouts.
      const revenue = amount;
      return { count, amount, revenue };
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
  return useMutation({
    mutationFn: async ({ slipId, stake }: { slipId: string; stake: number }) => {
      const { data } = await api.post("/betslips/place", { slipId, stake });
      return data.slip;
    }
  });
}
