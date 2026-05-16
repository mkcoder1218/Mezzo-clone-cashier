/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useCashierLimit, useDeposit, useWithdraw } from '../modules/cashier/hooks';
import { useAddSelection, useBulkUpsertSelections, useCashierBetStats, useCreateSlip, usePlaceSlip, useSlip } from '../modules/bets/hooks';
import { api } from '../lib/api';
import { useLookupOfflineTicket } from "../modules/offlineTickets/hooks";
import { printKingsBetSlip } from "../lib/printTicket";

interface DashboardProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  // ... other props kept for App.tsx compatibility
}

export const Dashboard = ({
  searchQuery,
  setSearchQuery,
}: DashboardProps) => {
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [depositAmount, setDepositAmount] = useState('30');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMessage, setWithdrawMessage] = useState<string>('');
  const [withdrawAllowed, setWithdrawAllowed] = useState<boolean>(false);
  const [withdrawable, setWithdrawable] = useState<number>(0);
  const [slipId, setSlipId] = useState<string | null>(null);
  const [outcomeId, setOutcomeId] = useState("");
  const [stake, setStake] = useState("50");
  
  const { data: limitData, refetch: refetchLimit } = useCashierLimit();
  const { data: betStats } = useCashierBetStats();
  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();
  const createSlip = useCreateSlip();
  const addSelection = useAddSelection();
  const bulkUpsert = useBulkUpsertSelections();
  const placeSlip = usePlaceSlip();
  const lookupOffline = useLookupOfflineTicket();
  const [offlineCode, setOfflineCode] = useState("");
  const [offlineLookupMessage, setOfflineLookupMessage] = useState("");
  const { data: slip, isLoading: slipLoading, refetch: refetchSlip } = useSlip(slipId);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceModalText, setBalanceModalText] = useState("Insufficient balance. Please add more limit to place this bet.");
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalText, setInfoModalText] = useState("");

  const extractError = (e: any) => {
    const codeRaw = e?.response?.data?.error?.code ?? e?.response?.data?.code ?? null;
    const messageRaw = e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? null;
    const code = codeRaw ? String(codeRaw) : null;
    const message = messageRaw ? String(messageRaw) : null;
    const status = Number(e?.response?.status || 0) || null;
    return { code, message, status };
  };

  const refreshWithdrawAllowed = async (userId: string) => {
    try {
      const { data } = await api.get(`/cashier/withdrawals/allowed?userId=${userId}`);
      setWithdrawAllowed(!!data.allowed);
      setWithdrawable(Number(data.withdrawable || 0));
    } catch {
      setWithdrawAllowed(false);
      setWithdrawable(0);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${searchQuery}`);
      setFoundUser(data.user);
      setWithdrawAmount("");
      setWithdrawMessage("");
      if (data.user?.id) await refreshWithdrawAllowed(data.user.id);
    } catch (err) {
      setFoundUser(null);
      alert('User not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeposit = async () => {
    if (!foundUser || !depositAmount) return;
    try {
      await depositMutation.mutateAsync({ 
        userId: foundUser.id, 
        amount: Number(depositAmount) 
      });
      setInfoModalText("Deposit successful.");
      setInfoModalOpen(true);
      await refreshWithdrawAllowed(foundUser.id);
      // Keep the user loaded so cashier can withdraw immediately if needed.
      refetchLimit();
    } catch (err: any) {
      const { code, message } = extractError(err);
      const codeU = String(code || "").toUpperCase();
      const msgL = String(message || "").toLowerCase();
      const isInsufficient =
        codeU === "INSUFFICIENT_BALANCE" ||
        msgL.includes("insufficient cashier credit limit") ||
        msgL.includes("insufficient balance") ||
        msgL.includes("not enough");
      if (isInsufficient) {
        setBalanceModalText("Insufficient balance. Please add more limit to deposit to this user.");
        setBalanceModalOpen(true);
        return;
      }
      setInfoModalText(message || "Deposit failed.");
      setInfoModalOpen(true);
    }
  };

  const handleWithdraw = async () => {
    if (!foundUser?.id) return;
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setWithdrawMessage("");
    try {
      await withdrawMutation.mutateAsync({ userId: foundUser.id, amount });
      setWithdrawMessage("Withdrawal successful.");
      setWithdrawAmount("");
      await refreshWithdrawAllowed(foundUser.id);
      refetchLimit();
    } catch (e: any) {
      const codeRaw = e?.response?.data?.error?.code ?? e?.response?.data?.code ?? "";
      const codeU = String(codeRaw || "").toUpperCase();
      if (codeU === "WITHDRAWAL_NOT_ALLOWED") {
        setWithdrawMessage("Only the depositing cashier can withdraw for this user.");
        return;
      }
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "Withdrawal failed";
      setWithdrawMessage(msg);
    }
  };



  const handleCreateSlip = async () => {
    if (!foundUser) return;
    const slip = await createSlip.mutateAsync({ userId: foundUser.id });
    setSlipId(slip.id);
    refetchSlip();
  };

  const handleAddSelection = async () => {
    if (!slipId || !outcomeId.trim()) return;
    await addSelection.mutateAsync({ slipId, outcomeId: outcomeId.trim() });
    setOutcomeId("");
    alert("Selection added");
    refetchSlip();
  };

  const handlePlace = async () => {
    if (!slipId) return;
    const n = Number(stake);
    if (!Number.isFinite(n) || n <= 0) return;
    try {
      const placed = await placeSlip.mutateAsync({ slipId, stake: n });
      // Print the placed ticket (receipt style). If backend returned a slim slip,
      // refetch the full slip before printing so selections render reliably.
      const printable = (placed as any)?.BetSelections?.length
        ? placed
        : (await api.get(`/betslips/${slipId}`)).data?.slip ?? placed;
      // Some responses omit stake/potentialPayout; ensure they render on the ticket.
      if ((printable as any)?.stake == null) (printable as any).stake = n;
      if ((printable as any)?.potentialPayout == null && Array.isArray((printable as any)?.BetSelections)) {
        const tot = (printable as any).BetSelections.reduce((p: number, s: any) => p * Number(s?.oddsAtPlacement || s?.snapshot?.outcome?.odds || 1), 1);
        (printable as any).potentialPayout = Number((n * tot).toFixed(2));
      }
      printKingsBetSlip(printable);
      setSlipId(null);
      refetchSlip();
      refetchLimit();
    } catch (e: any) {
      const { code, message } = extractError(e);
      const codeU = String(code || "").toUpperCase();
      const msgL = String(message || "").toLowerCase();
      const isInsufficient =
        codeU === "INSUFFICIENT_BALANCE" ||
        msgL.includes("insufficient cashier credit limit") ||
        msgL.includes("insufficient balance") ||
        msgL.includes("not enough");

      if (isInsufficient) {
        setBalanceModalText("Insufficient balance. Please add more limit to place this bet.");
        setBalanceModalOpen(true);
        return;
      }

      alert(message || "Could not place bet. Please try again.");
    }
  };

  const handleOfflineLookup = async () => {
    const code = offlineCode.trim().toUpperCase();
    if (!code) return;
    setOfflineLookupMessage("");

    let activeSlipId = slipId;
    if (!activeSlipId) {
      setOfflineLookupMessage("Creating slip…");
      const slip = await createSlip.mutateAsync({});
      activeSlipId = slip?.id || null;
      setSlipId(activeSlipId);
      if (!activeSlipId) {
        setOfflineLookupMessage("Failed to create slip for user.");
        return;
      }
    }
    try {
      const res = await lookupOffline.mutateAsync(code);
      if (res.ticket?.usedAt) {
        setOfflineLookupMessage(`Code ${res.ticket.shortCode} already used.`);
        return;
      }
      const selections = res.ticket?.payload?.selections || [];
      if (!selections.length) {
        setOfflineLookupMessage("No selections found for this code.");
        return;
      }

      const payloadSelections = selections
        .filter((s: any) => !!s?.outcomeId)
        .map((s: any) => ({
          outcomeId: String(s.outcomeId),
          acceptedOdds: Number(s.acceptedOdds ?? s.odds ?? s.displayOdds ?? 1),
          acceptedOddsVersion: Number(s.acceptedOddsVersion ?? s.oddsVersion ?? 1),
        }));

      if (!payloadSelections.length) {
        setOfflineLookupMessage("No selections found for this code.");
        return;
      }

      await bulkUpsert.mutateAsync({ slipId: activeSlipId, selections: payloadSelections });
      setOfflineLookupMessage(`Loaded ${payloadSelections.length} selections from ${res.ticket.shortCode}`);
      setOfflineCode("");
      setSlipId(activeSlipId);
      refetchSlip();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Offline ticket not found";
      setOfflineLookupMessage(msg);
      // eslint-disable-next-line no-console
      console.error("[offline-ticket-lookup]", msg, e);
    }
  };

  return (
    <div className="space-y-8 pt-2 max-w-5xl">
      {/* Modals */}
      {balanceModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[#1f282f] border border-gray-700 shadow-2xl p-6 rounded-sm">
            <div className="text-center">
              <div className="text-red-500 font-black text-xs uppercase tracking-widest">Error</div>
              <div className="mt-3 text-white font-bold text-sm leading-relaxed">{balanceModalText}</div>
              <button
                type="button"
                onClick={() => setBalanceModalOpen(false)}
                className="mt-6 w-full bg-[#ffde00] text-black font-black py-2 rounded-sm uppercase tracking-wider text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {infoModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[#1f282f] border border-gray-700 shadow-2xl p-6 rounded-sm">
            <div className="text-center">
              <div className="text-gray-400 font-black text-xs uppercase tracking-widest">Notification</div>
              <div className="mt-3 text-white font-bold text-sm leading-relaxed">{infoModalText}</div>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="mt-6 w-full bg-[#ffde00] text-black font-black py-2 rounded-sm uppercase tracking-wider text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Statistics Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100 uppercase tracking-tight">Statistics</h2>
          <div className="bg-[#1f282f] p-1.5 border border-gray-700 rounded-sm cursor-pointer hover:bg-gray-800 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-100"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </div>
        </div>
        
        <div className="bg-[#3a444d] border border-gray-700 rounded-sm overflow-hidden shadow-md">
          <div className="bg-[#2c353d] px-5 py-2 flex items-center justify-between border-b border-gray-700">
            <select className="bg-[#2c353d] text-white text-xs font-bold px-3 py-1 border border-gray-600 rounded-sm focus:outline-none cursor-pointer">
              <option>2026-05-16</option>
            </select>
            <div className="flex items-center">
              <span className="text-white text-xs font-bold uppercase tracking-tight mr-2">Revenue</span>
              <span className="bg-red-600 px-2 py-0.5 text-white rounded-sm font-bold text-xs min-w-[3rem] text-center shadow-inner">
                {Number(betStats?.revenue || 0).toFixed(0)}
              </span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-2.5">
            {[
              { label: 'Sport tickets count:', value: betStats?.count ?? 0 },
              { label: 'Sport tickets amount:', value: Number(betStats?.amount || 0).toFixed(2) },
              { label: 'Sport payout count:', value: 0 },
              { label: 'Sport payout amount:', value: 0 },
              { label: 'Number of deposits:', value: 0 },
              { label: 'Amount of deposits:', value: 0 },
              { label: 'Number of withdrawals:', value: 0 },
              { label: 'Amount of withdrawals:', value: 0 },
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-700/30 sm:border-0 pb-1 sm:pb-0">
                <span className="text-xs sm:text-sm text-gray-100 font-bold">{stat.label}</span>
                <span className="text-xs sm:text-sm font-bold text-[#ffde00]">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-8">
          {/* DEPOSIT Section */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-100 uppercase tracking-tight border-b border-gray-700/50 pb-1">DEPOSIT</h2>
            
            {/* Deposit Search */}
            <div className="bg-[#3a444d] p-5 rounded-sm border border-gray-700 shadow-sm">
              <label className="text-xs text-gray-300 font-bold mb-2 block uppercase tracking-wide">Deposit (search by ID, phone number or username)</label>
              <div className="flex items-center">
                <input 
                  placeholder="User Phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-white text-gray-800 py-2 px-3 text-sm focus:outline-none rounded-l-sm h-9"
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="bg-[#4fbfff] hover:bg-[#3dafee] px-4 transition-colors rounded-r-sm disabled:opacity-50 h-9 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Withdraw Search */}
            <div className="bg-[#3a444d] p-5 rounded-sm border border-gray-700 shadow-sm">
              <label className="text-xs text-gray-300 font-bold mb-2 block uppercase tracking-wide">Withdraw</label>
              <div className="flex items-center">
                <input
                  placeholder="Transaction Token"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-white text-gray-800 py-2 px-3 text-sm focus:outline-none rounded-l-sm h-9"
                  disabled={!foundUser || !withdrawAllowed || withdrawMutation.isPending}
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!foundUser || !withdrawAllowed || withdrawMutation.isPending}
                  className="bg-[#4fbfff] hover:bg-[#3dafee] px-4 transition-colors rounded-r-sm disabled:opacity-50 h-9 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Offline Ticket Search */}
            <div className="bg-[#3a444d] p-5 rounded-sm border border-gray-700 shadow-sm">
              <label className="text-xs text-gray-300 font-bold mb-2 block uppercase tracking-wide">Offline Ticket</label>
              <div className="flex items-center">
                <input
                  placeholder="Package ID"
                  value={offlineCode}
                  onChange={(e) => setOfflineCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOfflineLookup()}
                  className="flex-1 bg-white text-gray-800 py-2 px-3 text-sm focus:outline-none rounded-l-sm h-9"
                />
                <button 
                  onClick={handleOfflineLookup} 
                  disabled={lookupOffline.isPending || addSelection.isPending}
                  className="bg-[#4fbfff] hover:bg-[#3dafee] px-4 transition-colors rounded-r-sm disabled:opacity-50 h-9 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Package ID Section */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-100 uppercase tracking-tight border-b border-gray-700/50 pb-1">Package ID</h2>
            <div className="bg-[#3a444d] p-5 rounded-sm border border-gray-700 shadow-sm">
              <label className="text-xs text-gray-300 font-bold mb-2 block uppercase tracking-wide">Search (Payouts FreeBet Cashout)</label>
              <div className="flex items-center">
                <input
                  placeholder="Package ID"
                  className="flex-1 bg-white text-gray-800 py-2 px-3 text-sm focus:outline-none rounded-l-sm h-9"
                />
                <button 
                  className="bg-[#4fbfff] hover:bg-[#3dafee] px-4 transition-colors rounded-r-sm h-9 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: User Found & Bet Slip */}
        <div className="space-y-5 lg:sticky lg:top-24">
          {foundUser || slipId ? (
            <div className="bg-[#1f282f] border border-gray-700 rounded-sm shadow-xl overflow-hidden">
              <div className="bg-[#2c353d] px-5 py-2.5 border-b border-gray-700 flex justify-between items-center">
                <span className="font-black text-[#ffde00] uppercase text-xs tracking-wider">
                  {foundUser ? `USER: ${foundUser.phoneNumber || foundUser.displayName}` : "OFFLINE TICKET"}
                </span>
                <button onClick={() => setFoundUser(null)} className="text-gray-400 hover:text-white text-sm">✕</button>
              </div>
              <div className="p-5 space-y-5">
                {foundUser ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-300 uppercase tracking-wide">Balance:</span>
                      <span className="text-[#3eda3e] font-black text-lg">{foundUser.balance}</span>
                    </div>

                    <div className="bg-[#2c353d] border border-gray-600 p-3 rounded-sm space-y-3 shadow-inner">
                      <div className="flex items-center gap-2">
                        <input
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="flex-1 bg-white text-gray-800 text-sm px-3 py-1.5 rounded-sm focus:outline-none h-9 font-bold"
                        />
                        <button
                          onClick={handleDeposit}
                          className="bg-[#4fbfff] hover:bg-[#3dafee] text-white text-xs px-4 py-1 rounded-sm font-black h-9 uppercase shadow-sm transition-all active:scale-95"
                        >
                          FILL
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}

                {slipId ? (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BET SLIP</span>
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{slipId.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {slip?.BetSelections?.map((s: any) => (
                        <div key={s.id} className="bg-[#2c353d] p-3 rounded-sm border border-gray-700 shadow-sm">
                          <div className="font-bold text-xs text-gray-100 leading-tight">{s?.Outcome?.Market?.Fixture?.homeTeam?.name} vs {s?.Outcome?.Market?.Fixture?.awayTeam?.name}</div>
                          <div className="text-[11px] text-gray-400 mt-1 uppercase font-bold">{s?.Outcome?.Market?.name}: {s?.Outcome?.name}</div>
                          <div className="text-[#ffde00] font-black text-xs mt-1.5 flex items-center gap-1">
                            <span className="text-gray-500 text-[9px]">@</span>
                            {Number(s.oddsAtPlacement || 1).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 pt-3 border-t border-gray-700/50">
                      <div className="flex justify-between text-sm font-black uppercase tracking-tight">
                        <span className="text-gray-400">Total Odds:</span>
                        <span className="text-[#ffde00]">{(slip?.BetSelections || []).reduce((p: number, s: any) => p * Number(s.oddsAtPlacement || 1), 1).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          placeholder="Stake" 
                          value={stake} 
                          onChange={(e) => setStake(e.target.value)} 
                          className="flex-1 bg-white text-gray-800 text-sm px-3 py-1.5 rounded-sm focus:outline-none h-10 font-black" 
                        />
                        <button 
                          onClick={handlePlace} 
                          className="bg-[#3eda3e] hover:bg-[#2ebc2e] text-black text-xs px-5 py-1 rounded-sm font-black uppercase tracking-widest h-10 transition-all active:scale-95 shadow-md"
                        >
                          PLACE
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleCreateSlip} 
                    className="w-full bg-[#ffde00] hover:bg-[#e6c800] text-black text-xs font-black py-3 rounded-sm uppercase tracking-widest transition-all active:scale-95 shadow-md"
                  >
                    Create Slip
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#3a444d]/50 border border-gray-700 border-dashed rounded-sm p-10 text-center">
              <UserIcon size={40} className="text-gray-600 mx-auto mb-3 opacity-30" />
              <p className="text-xs text-gray-500 font-black uppercase tracking-widest">No User Selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
