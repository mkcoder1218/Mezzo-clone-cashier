/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useMyPlacedBets } from '../modules/bets/hooks';
import { api } from '../lib/api';
import { printKingsBetSlip } from '../lib/printTicket';
import { useMe } from '../modules/auth/hooks';

export const Bets = () => {
  const { data: slips, isLoading } = useMyPlacedBets();
  const { data: me } = useMe();
  const [copyingSlipId, setCopyingSlipId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const cashierName = String((me as any)?.displayName || (me as any)?.display_name || (me as any)?.phoneNumber || (me as any)?.email || "Cashier");

  const handleCopySlip = async (slipId: string) => {
    setCopyingSlipId(slipId);
    setCopyMessage("");
    try {
      const { data } = await api.get(`/betslips/${slipId}`);
      const slip = data?.slip;
      if (!slip) throw new Error("Bet slip not found");
      printKingsBetSlip({ ...slip, cashierName, printCopy: true });
    } catch (e: any) {
      setCopyMessage(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "Could not copy bet slip.");
    } finally {
      setCopyingSlipId(null);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Bets" />
      {copyMessage ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-[11px] font-black px-3 py-2 rounded-sm">
          {copyMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-sm border border-gray-700 shadow-2xl">
        <table className="w-full text-[10px] text-left bg-[#333c44]">
          <thead className="bg-[#2c353d] text-[#4fbfff] uppercase border-b border-gray-700 font-black tracking-widest">
            <tr>
              <th className="py-2 px-3 border-r border-gray-700/50">Placed At</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Slip ID</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Player</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Stake</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Potential Payout</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Result</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Payout</th>
              <th className="py-2 px-3">Copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-300">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-400 font-black">
                  Loading...
                </td>
              </tr>
            ) : slips?.length ? (
              slips.map((s: any) => (
                <tr key={s.id} className="hover:bg-black/10">
                  <td className="py-2 px-3 border-r border-gray-700/50">{s.placedAt ? new Date(s.placedAt).toLocaleString() : "-"}</td>
                  <td className="py-2 px-3 border-r border-gray-700/50 font-mono">{s.id}</td>
                  <td className="py-2 px-3 border-r border-gray-700/50">{s.User?.displayName || s.User?.phoneNumber || "-"}</td>
                  <td className="py-2 px-3 border-r border-gray-700/50">{s.stake || "-"}</td>
                  <td className="py-2 px-3 border-r border-gray-700/50">{s.potentialPayout || "-"}</td>
                  <td className="py-2 px-3 border-r border-gray-700/50">
                    <span className={
                      s.result === "won" ? "text-emerald-300" :
                      s.result === "lost" ? "text-red-300" :
                      s.result === "void" ? "text-yellow-300" :
                      "text-gray-300"
                    }>
                      {String(s.result || "pending").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 border-r border-gray-700/50">{s.payout || "-"}</td>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => handleCopySlip(s.id)}
                      disabled={copyingSlipId === s.id}
                      title="Copy bet slip"
                      className="h-7 px-2.5 rounded-sm bg-[#4fbfff] hover:bg-[#3dafee] text-white font-black uppercase text-[9px] inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Copy size={12} />
                      {copyingSlipId === s.id ? "..." : "Copy"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-400 font-black">
                  No bets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
