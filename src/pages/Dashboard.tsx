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
      // Print the placed ticket (receipt style) instead of alert.
      printKingsBetSlip(placed);
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
    <div className="space-y-6 pt-2">
      <PageHeader title="Statistics" />

      {balanceModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setBalanceModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#1f1a2d] border border-white/10 shadow-2xl p-6 rounded-md">
            <div className="text-center">
              <div className="text-red-400 font-black text-sm uppercase tracking-widest">Error</div>
              <div className="mt-3 text-white font-bold text-sm leading-relaxed">{balanceModalText}</div>
              <button
                type="button"
                onClick={() => setBalanceModalOpen(false)}
                className="mt-5 w-full bg-[#ffde00] text-black font-black py-2 rounded-sm uppercase tracking-widest text-[12px] hover:brightness-105"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {infoModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setInfoModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#1f1a2d] border border-white/10 shadow-2xl p-6 rounded-md">
            <div className="text-center">
              <div className="text-white/80 font-black text-sm uppercase tracking-widest">Message</div>
              <div className="mt-3 text-white font-bold text-sm leading-relaxed">{infoModalText}</div>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="mt-5 w-full bg-[#ffde00] text-black font-black py-2 rounded-sm uppercase tracking-widest text-[12px] hover:brightness-105"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 items-start bg-[#333c44] p-3 rounded-sm border border-gray-700/50">
        <div className="flex items-center justify-between col-span-full mb-3 border-b border-gray-700 pb-1.5 font-black uppercase tracking-widest text-[10px] text-gray-400">
           <span>Stat Summary</span>
           <div className="flex items-center gap-1">
            <span className="text-white bg-gray-600 px-1.5 py-0.5 rounded-l-sm">Revenue</span>
            <span className="bg-[#ffde00] px-1.5 py-0.5 text-black rounded-r-sm font-bold">
              {Number(betStats?.revenue || 0).toFixed(2)}
            </span>
          </div>
        </div>

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
          <div key={i} className="flex justify-between items-center py-0.5 border-b border-gray-700/30">
            <span className="text-[11px] text-gray-400 font-black uppercase tracking-tight">{stat.label}</span>
            <span className="text-[11px] font-black text-[#ffde00]">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mt-8">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-1">DEPOSIT</h2>
            <div className="bg-[#3a444d] p-3 rounded-sm border border-gray-700 shadow-lg">
              <p className="text-[11px] text-gray-500 font-black mb-1.5 uppercase tracking-widest">Deposit (search by ID or Phone)</p>
              <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
                <input 
                  placeholder="User Phone or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-white text-gray-800 py-1 px-2 text-xs focus:outline-none"
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="bg-[#4fbfff] hover:bg-[#3dafee] p-1 transition-colors disabled:opacity-50"
                >
                  <Search size={14} className="text-white" />
                </button>
              </div>
            </div>

            {/* Withdraw (user-based) */}
            <div className="bg-[#3a444d] p-3 rounded-sm border border-gray-700 shadow-lg">
              <p className="text-[11px] text-gray-500 font-black mb-1.5 uppercase tracking-widest">Withdraw</p>
              <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
                <input
                  placeholder={foundUser ? `Amount (max ${withdrawable.toFixed(2)})` : "Search user first"}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-white text-gray-800 py-1 px-2 text-xs focus:outline-none"
                  disabled={!foundUser || !withdrawAllowed || withdrawMutation.isPending}
                />
                <button
                  type="button"
                  className="bg-[#4fbfff] hover:bg-[#3dafee] p-1 transition-colors disabled:opacity-50"
                  onClick={handleWithdraw}
                  disabled={!foundUser || !withdrawAllowed || withdrawMutation.isPending}
                  title={!withdrawAllowed && foundUser ? "Only the depositing cashier can withdraw for this user." : "Withdraw"}
                >
                  <Search size={14} className="text-white" />
                </button>
              </div>

              {!foundUser ? (
                <div className="mt-2 bg-[#2c353d] border border-gray-700 rounded-sm p-2">
                  <div className="text-[11px] font-black text-gray-200 uppercase">Deposit for withdrawal</div>
                  <div className="mt-1 text-[11px] text-gray-400 font-black">
                    Search the user first, then deposit to enable withdrawals.
                  </div>
                </div>
              ) : null}

              {foundUser && !withdrawAllowed ? (
                <div className="mt-2 bg-[#2c353d] border border-gray-700 rounded-sm p-2">
                  <div className="text-[11px] font-black text-gray-200 uppercase">Withdrawal locked</div>
                  <div className="mt-1 text-[11px] text-gray-400 font-black">
                    Only the depositing cashier can withdraw for this user. Deposit with this cashier to enable.
                  </div>
                </div>
              ) : null}

              {withdrawMessage ? (
                <div className={`mt-2 text-[11px] font-black ${withdrawMessage.includes("successful") ? "text-[#3eda3e]" : "text-red-400"}`}>
                  {withdrawMessage}
                </div>
              ) : null}
            </div>

            <div className="bg-[#3a444d] p-3 rounded-sm border border-gray-700 shadow-lg mt-3">
              <p className="text-[11px] text-gray-500 font-black mb-1.5 uppercase tracking-widest">Offline Ticket</p>
              <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
                <input
                  placeholder="Short code (e.g. S765020)"
                  value={offlineCode}
                  onChange={(e) => setOfflineCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOfflineLookup()}
                  className="flex-1 bg-transparent text-white py-2 px-2 text-xs font-bold focus:outline-none"
                />
                <button type="button" className="bg-[#4fbfff] hover:bg-[#3dafee] p-1.5 transition-colors" onClick={handleOfflineLookup} disabled={lookupOffline.isPending || addSelection.isPending}>
                  <Search size={14} className="text-white" />
                </button>
              </div>
              {lookupOffline.isPending ? (
                <div className="mt-2 text-[11px] text-gray-400 font-black uppercase tracking-widest">Searching…</div>
              ) : offlineLookupMessage ? (
                <div className="mt-2 text-[11px] text-gray-300 font-black">{offlineLookupMessage}</div>
              ) : null}
            </div>
        </div>

        <div className="space-y-4">
          {(slipId && (slipLoading || (slip?.BetSelections || []).length > 0)) ? (
            <div className="bg-[#3a444d] rounded-sm border border-gray-700 shadow-lg overflow-hidden">
              <div className="bg-[#333c44] px-3 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="text-[12px] font-black uppercase tracking-widest text-gray-200">BET SLIP</div>
                <div className="text-[10px] font-mono text-gray-400">{slipId}</div>
              </div>

              <div className="p-3 space-y-2">
                {slipLoading ? (
                  <div className="text-[11px] text-gray-400 font-black">Loading slip…</div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {slip.BetSelections.map((s: any) => (
                        <div key={s.id} className="bg-[#2c353d] border border-gray-700 rounded-sm px-2 py-2">
                          <div className="text-[11px] font-black text-gray-200 truncate">
                            {s?.Outcome?.Market?.Fixture?.homeTeam?.name} vs {s?.Outcome?.Market?.Fixture?.awayTeam?.name}
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase truncate">
                            {s?.Outcome?.Market?.name || s?.snapshot?.market?.name || "Market"}: {s?.Outcome?.name || s?.snapshot?.outcome?.name}
                          </div>
                          <div className="text-[11px] font-black text-[#ffde00]">x {Number(s.oddsAtPlacement || s?.snapshot?.outcome?.odds || 1).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-700 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black text-gray-300">
                        <span>Total Odds</span>
                        <span className="text-white">
                          {(() => {
                            const product = (slip?.BetSelections || []).reduce((p: number, s: any) => p * Number(s.oddsAtPlacement || 1), 1);
                            return product.toFixed(2);
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="Stake"
                          value={stake}
                          onChange={(e) => setStake(e.target.value)}
                          className="w-32 bg-white text-gray-800 py-2 px-2 text-xs font-bold focus:outline-none rounded-sm"
                        />
                        <button
                          type="button"
                          onClick={handlePlace}
                          disabled={!slipId || placeSlip.isPending}
                          className="flex-1 bg-[#4fbfff] hover:bg-[#3dafee] text-white text-[12px] font-black px-4 py-2 rounded-sm uppercase tracking-widest disabled:opacity-50"
                        >
                          {placeSlip.isPending ? "PLACING..." : "Place bet"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {foundUser ? (
            <div className="bg-[#3a444d] p-4 rounded-sm border border-gray-700 shadow-lg">
              <h3 className="text-[12px] font-black text-gray-200 border-b border-gray-700 pb-2 mb-4 uppercase">User Found</h3>
              <div className="space-y-2 mb-6">
                <p className="text-[12px]"><span className="text-gray-400 font-black uppercase">Phone -</span> <span className="text-white font-black ml-2">{foundUser.phoneNumber}</span></p>
                <p className="text-[12px]"><span className="text-gray-400 font-black uppercase">Name -</span> <span className="text-white font-black ml-2">{foundUser.displayName}</span></p>
                <p className="text-[11px]"><span className="text-[#ffde00] font-black uppercase ml-0">Current Balance - </span> <span className="text-white font-black text-sm ml-2">{foundUser.balance}</span></p>
              </div>
              <div className="bg-[#2c353d] border border-gray-600 rounded-sm p-0.5 flex items-center shadow-inner">
                <div className="bg-[#4fbfff] text-white text-[10px] font-black px-2 py-1.5 rounded-sm uppercase tracking-tighter shrink-0 border-r border-[#3dafee]">
                  CASH IN -
                </div>
                <input type="text" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="bg-transparent text-white font-black text-xs w-full focus:outline-none px-2" />
                <button onClick={handleDeposit} disabled={depositMutation.isPending} className="bg-[#4fbfff] hover:bg-[#3dafee] text-white text-[10px] font-black px-3 py-1.5 rounded-sm uppercase transition-all active:scale-95 disabled:opacity-50">
                  {depositMutation.isPending ? 'WAIT...' : 'FILL'}
                </button>
              </div>

              <div className="mt-4 border-t border-gray-700 pt-4 space-y-2">
                <div className="text-[12px] font-black uppercase tracking-widest text-gray-200">Cashier Slip (Online User)</div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCreateSlip} disabled={createSlip.isPending} className="bg-[#ffde00] text-black px-3 py-2 text-[12px] font-black rounded-sm uppercase tracking-widest disabled:opacity-50">
                    {slipId ? "Slip Ready" : createSlip.isPending ? "CREATING..." : "Create Slip"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input placeholder="Outcome ID" value={outcomeId} onChange={(e) => setOutcomeId(e.target.value)} className="flex-1 bg-white text-gray-800 py-2 px-2 text-xs font-bold focus:outline-none rounded-sm" />
                  <button onClick={handleAddSelection} disabled={!slipId || addSelection.isPending} className="bg-[#333c44] border border-gray-600 text-white font-black py-2 px-4 text-[12px] uppercase tracking-widest hover:border-[#ffde00] hover:text-[#ffde00] disabled:opacity-50">
                    {addSelection.isPending ? "ADDING..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
