/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, User as UserIcon, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useCashierLimit, useDeposit, useWithdraw } from '../modules/cashier/hooks';
import { useAddSelection, useBulkUpsertSelections, useCashierBetStats, useCreateSlip, usePlaceSlip, useSlip } from '../modules/bets/hooks';
import { api } from '../lib/api';
import { useLookupOfflineTicket, useUseOfflineTicket } from "../modules/offlineTickets/hooks";
import { printKingsBetSlip } from "../lib/printTicket";

interface DashboardProps {
  initialSearchQuery?: string;
  // ... other props kept for App.tsx compatibility
}

export const Dashboard = ({
  initialSearchQuery = "",
}: DashboardProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [withdrawSearchQuery, setWithdrawSearchQuery] = useState("");
  const [withdrawalInfo, setWithdrawalInfo] = useState<any>(null);
  const [activeUserAction, setActiveUserAction] = useState<"deposit" | "withdraw" | null>(null);
  const [depositAmount, setDepositAmount] = useState('30');
  const [withdrawMessage, setWithdrawMessage] = useState<string>('');
  const [slipId, setSlipId] = useState<string | null>(null);
  const [outcomeId, setOutcomeId] = useState("");
  const [stake, setStake] = useState("50");
  const [statsDate, setStatsDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  
  const { data: limitData, refetch: refetchLimit } = useCashierLimit();
  const { data: betStats } = useCashierBetStats(statsDate);
  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();
  const createSlip = useCreateSlip();
  const addSelection = useAddSelection();
  const bulkUpsert = useBulkUpsertSelections();
  const placeSlip = usePlaceSlip();
  const lookupOffline = useLookupOfflineTicket();
  const useOfflineTicket = useUseOfflineTicket();
  const [offlineCode, setOfflineCode] = useState("");
  const [loadedOfflineCode, setLoadedOfflineCode] = useState("");
  const [offlineLookupMessage, setOfflineLookupMessage] = useState("");
  const [offlineSelectionsLoading, setOfflineSelectionsLoading] = useState(false);
  const { data: slip, isLoading: slipLoading, refetch: refetchSlip } = useSlip(slipId);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceModalText, setBalanceModalText] = useState("Insufficient balance. Please add more limit to place this bet.");
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalText, setInfoModalText] = useState("");
  const [mobileUserPanelOpen, setMobileUserPanelOpen] = useState(false);

  const extractError = (e: any) => {
    const codeRaw = e?.response?.data?.error?.code ?? e?.response?.data?.code ?? null;
    const messageRaw = e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? null;
    const code = codeRaw ? String(codeRaw) : null;
    const message = messageRaw ? String(messageRaw) : null;
    const status = Number(e?.response?.status || 0) || null;
    return { code, message, status };
  };

  const formatDateTime = (value: any) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const normalizeSearchQuery = (rawInput: string) => {
    const raw = rawInput.trim();
    if (!raw) return "";
    // Normalize Ethiopian numbers: 09xxxxxxxx -> +2519xxxxxxxx, 0xxxxxxxxx -> +251xxxxxxxxx
    const q = raw.replace(/\s+/g, "");
    if (/^0\d{8,12}$/.test(q)) return `+251${q.slice(1)}`;
    if (/^251\d{8,12}$/.test(q)) return `+${q}`;
    return q;
  };

  const lookupUser = async (rawInput: string) => {
    const normalizedQuery = normalizeSearchQuery(rawInput);
    if (!normalizedQuery) return null;
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(normalizedQuery)}`);
    return data.user;
  };

  const handleDepositSearch = async () => {
    const raw = searchQuery.trim();
    if (!raw) return;
    setIsSearching(true);
    try {
      const user = await lookupUser(raw);
      setFoundUser(user);
      setActiveUserAction("deposit");
      setSlipId(null); // Hide betslip when doing deposit/withdraw flows
      setWithdrawMessage("");
      setMobileUserPanelOpen(true);
    } catch (err) {
      setFoundUser(null);
      alert('User not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWithdrawSearch = async () => {
    const token = withdrawSearchQuery.trim();
    if (!token) return;
    setIsSearching(true);
    setWithdrawMessage("");
    setWithdrawalInfo(null);
    try {
      const { data } = await api.get(`/cashier/withdrawals/token?token=${encodeURIComponent(token)}`);
      setWithdrawalInfo(data.request);
      setMobileUserPanelOpen(true);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "Withdrawal token not found";
      setWithdrawMessage(msg);
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
    const token = String(withdrawalInfo?.token || withdrawSearchQuery).trim();
    if (!token) return;
    setWithdrawMessage("");
    try {
      const res = await withdrawMutation.mutateAsync({ token });
      const amount = Number(res?.result?.amount || 0).toFixed(2);
      setWithdrawMessage(`Withdrawal successful. Paid ${amount} ETB.`);
      setWithdrawSearchQuery("");
      setWithdrawalInfo(null);
      refetchLimit();
    } catch (e: any) {
      const codeRaw = e?.response?.data?.error?.code ?? e?.response?.data?.code ?? "";
      const codeU = String(codeRaw || "").toUpperCase();
      if (codeU === "WITHDRAWAL_NOT_ALLOWED") {
        setWithdrawMessage("Only the depositing cashier or shop can redeem this token.");
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
    setMobileUserPanelOpen(true);
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
        : betSelections.length
          ? { ...(slip || {}), ...(placed || {}), id: slipId, BetSelections: betSelections }
          : placed;
      // Some responses omit stake/potentialPayout; ensure they render on the ticket.
      if ((printable as any)?.stake == null) (printable as any).stake = n;
      if ((printable as any)?.potentialPayout == null && Array.isArray((printable as any)?.BetSelections)) {
        const tot = (printable as any).BetSelections.reduce((p: number, s: any) => {
          const odds = Number(s?.oddsAtPlacement || s?.snapshot?.outcome?.displayOdds || s?.snapshot?.outcome?.odds || 1);
          return p * (Number.isFinite(odds) && odds > 0 ? Number(odds.toFixed(2)) : 1);
        }, 1);
        (printable as any).totalOdds = Number(tot.toFixed(2));
        (printable as any).potentialPayout = Number((n * tot).toFixed(2));
      }
      if (loadedOfflineCode) (printable as any).shortCode = loadedOfflineCode;
      printKingsBetSlip(printable);
      if (loadedOfflineCode) {
        useOfflineTicket.mutateAsync(loadedOfflineCode).catch((err) => {
          // Placement already succeeded; do not turn a receipt into a failed bet.
          console.error("[offline-ticket-use]", err);
        });
        setLoadedOfflineCode("");
      }
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
    setOfflineSelectionsLoading(true);

    let activeSlipId = slipId;
    try {
      const res = await lookupOffline.mutateAsync(code);
      if (res.ticket?.usedAt) {
        setOfflineLookupMessage(`Code ${res.ticket.shortCode} already used.`);
        setOfflineSelectionsLoading(false);
        return;
      }

      const payloadStake = res.ticket?.payload?.stake;
      if (payloadStake !== null && payloadStake !== undefined && !Number.isNaN(Number(payloadStake))) {
        setStake(String(payloadStake));
      }

      const selections = res.ticket?.payload?.selections || [];
      if (!selections.length) {
        setOfflineLookupMessage("No selections found for this code.");
        setOfflineSelectionsLoading(false);
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
        setOfflineSelectionsLoading(false);
        return;
      }

      setMobileUserPanelOpen(true);

      if (!activeSlipId) {
        setOfflineLookupMessage("Creating slip...");
        const createdSlip = await createSlip.mutateAsync({});
        activeSlipId = createdSlip?.id || null;
        if (!activeSlipId) {
          setOfflineLookupMessage("Failed to create slip for user.");
          setOfflineSelectionsLoading(false);
          return;
        }
      }

      const bulkResult = await bulkUpsert.mutateAsync({ slipId: activeSlipId, selections: payloadSelections });
      queryClient.setQueryData(["cashier-slip", activeSlipId], {
        id: activeSlipId,
        status: "open",
        stake: payloadStake ?? stake,
        totalOdds: bulkResult?.totalOdds ?? null,
        potentialPayout: bulkResult?.potentialPayout ?? null,
        BetSelections: bulkResult?.selections || [],
      });
      setOfflineLookupMessage(`Loaded ${payloadSelections.length} selections from ${res.ticket.shortCode}`);
      setLoadedOfflineCode(String(res.ticket.shortCode || code).toUpperCase());
      setOfflineCode("");
      setSlipId(activeSlipId);
      setMobileUserPanelOpen(true);
      setOfflineSelectionsLoading(false);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Offline ticket not found";
      setOfflineLookupMessage(msg);
      setOfflineSelectionsLoading(false);
      // eslint-disable-next-line no-console
      console.error("[offline-ticket-lookup]", msg, e);
    }
  };
  const betslipLoading = Boolean(slipId && !foundUser && (offlineSelectionsLoading || lookupOffline.isPending || bulkUpsert.isPending || slipLoading));
  const betSelections = slip?.BetSelections || [];

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
            <input
              type="date"
              value={statsDate}
              onChange={(e) => setStatsDate(e.target.value)}
              className="bg-[#2c353d] text-white text-xs font-bold px-3 py-1 border border-gray-600 rounded-sm focus:outline-none cursor-pointer"
            />
            <div className="flex items-center">
              <span className="text-white text-xs font-bold uppercase tracking-tight mr-2">Revenue</span>
              <span className="bg-red-600 px-2 py-0.5 text-white rounded-sm font-bold text-xs min-w-[3rem] text-center shadow-inner">
                {Number((betStats as any)?.tickets?.revenue || 0).toFixed(0)}
              </span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-2.5">
            {[
              { label: 'Sport tickets count:', value: (betStats as any)?.tickets?.count ?? 0 },
              { label: 'Sport tickets amount:', value: Number((betStats as any)?.tickets?.amount || 0).toFixed(2) },
              { label: 'Sport payout count:', value: 0 },
              { label: 'Sport payout amount:', value: 0 },
              { label: 'Number of deposits:', value: (betStats as any)?.deposits?.count ?? 0 },
              { label: 'Amount of deposits:', value: Number((betStats as any)?.deposits?.amount || 0).toFixed(2) },
              { label: 'Number of withdrawals:', value: (betStats as any)?.withdrawals?.count ?? 0 },
              { label: 'Amount of withdrawals:', value: Number((betStats as any)?.withdrawals?.amount || 0).toFixed(2) },
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
                  onKeyDown={(e) => e.key === 'Enter' && handleDepositSearch()}
                  className="flex-1 bg-white text-gray-800 py-2 px-3 text-sm focus:outline-none rounded-l-sm h-9"
                />
                <button 
                  onClick={handleDepositSearch} 
                  disabled={isSearching}
                  className="bg-[#4fbfff] hover:bg-[#3dafee] px-4 transition-colors rounded-r-sm disabled:opacity-50 h-9 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Withdraw Token */}
            <div className="bg-[#3a444d] p-5 rounded-sm border border-gray-700 shadow-sm">
              <label className="text-xs text-gray-300 font-bold mb-2 block uppercase tracking-wide">Withdraw (enter customer token)</label>
              <div className="flex items-center">
                <input
                  placeholder="Withdrawal Token"
                  value={withdrawSearchQuery}
                  onChange={(e) => {
                    setWithdrawSearchQuery(e.target.value.toUpperCase());
                    setWithdrawalInfo(null);
                    setWithdrawMessage("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleWithdrawSearch()}
                  className="flex-1 bg-white text-gray-800 py-2 px-3 text-sm focus:outline-none rounded-l-sm h-9"
                />
                <button
                  onClick={handleWithdrawSearch}
                  disabled={isSearching}
                  className="bg-[#4fbfff] hover:bg-[#3dafee] px-4 transition-colors rounded-r-sm disabled:opacity-50 h-9 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>
              {withdrawMessage ? <div className="mt-2 text-[11px] text-gray-300 font-bold">{withdrawMessage}</div> : null}
              {withdrawalInfo ? (
                <div className="mt-4 bg-[#2c353d] border border-gray-600 rounded-sm p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Withdrawal information</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${
                      withdrawalInfo.status === "pending" ? "bg-[#3eda3e] text-black" : "bg-red-600 text-white"
                    }`}>
                      {withdrawalInfo.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500 font-black uppercase text-[9px]">Token</div>
                      <div className="text-white font-black">{withdrawalInfo.token}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-black uppercase text-[9px]">Amount</div>
                      <div className="text-[#ffde00] font-black">{Number(withdrawalInfo.amount || 0).toFixed(2)} ETB</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-black uppercase text-[9px]">Expires</div>
                      <div className="text-white font-bold">{formatDateTime(withdrawalInfo.expiresAt)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-black uppercase text-[9px]">User Balance</div>
                      <div className="text-[#3eda3e] font-black">{Number(withdrawalInfo.user?.balance || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="text-gray-500 font-black uppercase text-[9px] mb-1">User information</div>
                    <div className="text-white font-black text-sm">{withdrawalInfo.user?.phoneNumber || withdrawalInfo.user?.displayName || "-"}</div>
                    <div className="text-gray-400 text-[11px] font-bold">{withdrawalInfo.user?.displayName || withdrawalInfo.user?.email || withdrawalInfo.user?.id || "-"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={withdrawalInfo.status !== "pending" || withdrawMutation.isPending}
                    className="w-full bg-[#3eda3e] hover:bg-[#2ebc2e] text-black text-xs px-4 py-2 rounded-sm font-black uppercase shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                  </button>
                </div>
              ) : null}
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

        {foundUser || slipId ? (
          <button
            type="button"
            onClick={() => setMobileUserPanelOpen(true)}
            className={[
              "lg:hidden fixed right-4 bottom-4 z-[170] bg-[#ffde00] text-black px-4 py-3 rounded-sm font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95",
              mobileUserPanelOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            ].join(" ")}
          >
            User View
          </button>
        ) : null}

        {mobileUserPanelOpen && (foundUser || slipId) ? (
          <button
            type="button"
            aria-label="Close user view"
            onClick={() => setMobileUserPanelOpen(false)}
            className="lg:hidden fixed inset-0 z-[175] bg-black/45"
          />
        ) : null}

        {/* User drawer / desktop side panel */}
        <div className={[
          "space-y-5 will-change-transform transition-transform duration-100 ease-out lg:sticky lg:top-24",
          foundUser || slipId
            ? `fixed inset-x-0 bottom-0 z-[180] max-h-[82dvh] overflow-y-auto rounded-t-lg bg-[#2c353d] border-t border-gray-700 p-3 shadow-2xl lg:static lg:max-h-none lg:translate-y-0 lg:overflow-visible lg:bg-transparent lg:border-0 lg:p-0 lg:shadow-none ${
                mobileUserPanelOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
              }`
            : "hidden lg:block"
        ].join(" ")}>
          {foundUser || slipId ? (
            <div className="bg-[#1f282f] border border-gray-700 rounded-sm shadow-xl overflow-hidden">
              <div className="bg-[#2c353d] px-5 py-2.5 border-b border-gray-700 flex justify-between items-center">
                <span className="font-black text-[#ffde00] uppercase text-xs tracking-wider">
                  {foundUser ? `USER: ${foundUser.phoneNumber || foundUser.displayName}` : "OFFLINE TICKET"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFoundUser(null);
                    setSlipId(null);
                    setMobileUserPanelOpen(false);
                  }}
                  className="lg:hidden text-gray-400 hover:text-white"
                  title="Close user view"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => {
                    setFoundUser(null);
                    setSlipId(null);
                    setMobileUserPanelOpen(false);
                  }}
                  className="hidden lg:block text-gray-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 space-y-5">
                {foundUser ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-300 uppercase tracking-wide">Balance:</span>
                      <span className="text-[#3eda3e] font-black text-lg">{foundUser.balance}</span>
                    </div>

                    {activeUserAction === "deposit" ? (
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
                            DEPOSIT
                          </button>
                        </div>
                      </div>
                    ) : null}

                  </>
                ) : null}

                {/* Only show betslip UI when working with offline tickets (no user selected) */}
                {slipId && !foundUser ? (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BET SLIP</span>
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{slipId.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {betslipLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="bg-[#2c353d] p-3 rounded-sm border border-gray-700 shadow-sm animate-pulse">
                            <div className="h-3 w-4/5 bg-gray-600/70 rounded" />
                            <div className="h-2.5 w-3/5 bg-gray-700/80 rounded mt-2" />
                            <div className="h-3 w-12 bg-[#ffde00]/30 rounded mt-2" />
                          </div>
                        ))
                      ) : betSelections.map((s: any) => (
                        <div key={s.id} className="bg-[#2c353d] p-3 rounded-sm border border-gray-700 shadow-sm">
                          {(() => {
                            const fixture = s?.Outcome?.Market?.Fixture || s?.snapshot?.fixture || {};
                            const home = fixture?.homeTeam?.name || fixture?.homeTeamName || "";
                            const away = fixture?.awayTeam?.name || fixture?.awayTeamName || "";
                            const marketName = s?.Outcome?.Market?.name || s?.snapshot?.market?.name || "";
                            const outcomeName = s?.Outcome?.name || s?.snapshot?.outcome?.name || "";
                            return (
                              <>
                                <div className="font-bold text-xs text-gray-100 leading-tight">
                                  {home && away ? `${home} vs ${away}` : "Selection"}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 uppercase font-bold">
                                  {marketName ? `${marketName}: ` : ""}{outcomeName || ""}
                                </div>
                              </>
                            );
                          })()}
                          <div className="text-[#ffde00] font-black text-xs mt-1.5 flex items-center gap-1">
                            <span className="text-gray-500 text-[9px]">@</span>
                            {Number(s.oddsAtPlacement || s?.snapshot?.outcome?.odds || 1).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 pt-3 border-t border-gray-700/50">
                      <div className="flex justify-between text-sm font-black uppercase tracking-tight">
                        <span className="text-gray-400">Total Odds:</span>
                        <span className="text-[#ffde00]">{betslipLoading ? "--" : betSelections.reduce((p: number, s: any) => p * Number(s.oddsAtPlacement || 1), 1).toFixed(2)}</span>
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
                          disabled={betslipLoading || !betSelections.length}
                          className="bg-[#3eda3e] hover:bg-[#2ebc2e] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs px-5 py-1 rounded-sm font-black uppercase tracking-widest h-10 transition-all active:scale-95 shadow-md"
                        >
                          {betslipLoading ? "LOADING" : "PLACE"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
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

