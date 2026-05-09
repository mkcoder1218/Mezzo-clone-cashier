/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from "../lib/api";
import { usePaySlip } from "../modules/cashier/hooks";
import { useCashierLimit } from "../modules/cashier/hooks";

export const TicketPayouts = () => {
  const [slipId, setSlipId] = useState("");
  const [slip, setSlip] = useState<any>(null);
  const [message, setMessage] = useState<string>("");
  const paySlip = usePaySlip();
  const { refetch: refetchLimit } = useCashierLimit();

  const handleLookup = async () => {
    const id = slipId.trim();
    if (!id) return;
    setMessage("");
    setSlip(null);
    try {
      const { data } = await api.get(`/betslips/${id}`);
      setSlip(data.slip);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "Ticket not found";
      setMessage(msg);
    }
  };

  const handlePay = async () => {
    if (!slip?.id) return;
    setMessage("");
    try {
      await paySlip.mutateAsync({ slipId: slip.id });
      setMessage("Paid successfully.");
      setSlip(null);
      setSlipId("");
      refetchLimit();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "Could not pay ticket";
      setMessage(msg);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Package ID" />
      <div className="bg-[#3a444d] p-6 rounded-sm border border-gray-700 shadow-2xl max-w-xl mx-auto mt-8">
        <p className="text-[9px] text-gray-500 font-black mb-3 uppercase tracking-widest">Search (Payouts FreeBet Cashout)</p>
        <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d] shadow-inner overflow-hidden">
          <input 
            placeholder="Bet slip number (UUID)"
            value={slipId}
            onChange={(e) => setSlipId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 bg-white text-gray-800 py-1.5 px-3 text-xs font-medium focus:outline-none placeholder-gray-400"
          />
          <button type="button" onClick={handleLookup} className="bg-[#4fbfff] hover:bg-[#3dafee] p-2 transition-all">
            <Search size={16} className="text-white" />
          </button>
        </div>

        {slip ? (
          <div className="mt-4 bg-[#2c353d] border border-gray-700 rounded-sm p-3">
            <div className="text-[11px] font-black text-gray-200">Ticket: <span className="font-mono text-gray-400">{slip.id}</span></div>
            <div className="mt-1 text-[11px] font-black text-gray-300 uppercase">Result: <span className="text-white">{String(slip.result || "pending")}</span></div>
            <div className="mt-1 text-[11px] font-black text-gray-300">Potential Payout: <span className="text-[#ffde00]">{Number(slip.potentialPayout || 0).toFixed(2)}</span></div>
            <div className="mt-1 text-[11px] font-black text-gray-300">Paid: <span className={slip.paidAt ? "text-[#3eda3e]" : "text-red-400"}>{slip.paidAt ? "YES" : "NO"}</span></div>
            <button
              type="button"
              onClick={handlePay}
              disabled={paySlip.isPending || slip.paidAt || String(slip.result) !== "won"}
              className="mt-3 w-full bg-[#ffde00] text-black font-black py-2 rounded-sm uppercase tracking-widest text-[11px] hover:brightness-105 disabled:opacity-50"
            >
              {paySlip.isPending ? "PAYING..." : "PAY"}
            </button>
          </div>
        ) : null}

        {message ? (
          <div className={`mt-3 text-[11px] font-black ${message.toLowerCase().includes("success") ? "text-[#3eda3e]" : "text-red-400"}`}>
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
};
