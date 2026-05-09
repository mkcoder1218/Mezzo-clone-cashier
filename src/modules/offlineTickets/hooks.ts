import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useLookupOfflineTicket() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.get(`/offline-tickets/${encodeURIComponent(code)}`);
      return data as { ticket: { shortCode: string; expiresAt: string; usedAt?: string | null; payload: any } };
    }
  });
}

