/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip?: any;
  isLoading?: boolean;
  error?: string;
}

function money(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : '-';
}

function dateTime(v?: string | null) {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function selectionRows(slip: any) {
  return slip?.BetSelections || slip?.selections || [];
}

export const TicketModal = ({ isOpen, onClose, slip, isLoading, error }: TicketModalProps) => {
  if (!isOpen) return null;

  const ticketCode = String(slip?.shortCode || slip?.id?.slice?.(0, 12) || '-').toUpperCase();
  const rows = selectionRows(slip);

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 p-3 sm:p-6">
      <div className="bg-[#2c353d] w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl rounded-sm border border-gray-700">
        <div className="bg-[#333c44] flex items-center justify-between px-3 py-2 border-b border-gray-700">
          <span className="text-white text-[12px] font-black uppercase tracking-widest">Ticket</span>
          <button type="button" className="text-white hover:text-[#ffde00]" onClick={onClose} aria-label="Close ticket">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-42px)] bg-white text-gray-900 p-4">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500 text-sm font-black uppercase">Loading ticket...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-600 text-sm font-black">{error}</div>
          ) : slip ? (
            <div className="mx-auto w-full max-w-[360px] text-[12px] font-bold">
              <div className="text-center border-b border-gray-900 pb-2 mb-2">
                <div className="text-2xl font-black italic leading-none">KING5BET</div>
                <div className="text-[11px] font-black tracking-widest mt-1">SPORT // {ticketCode}</div>
              </div>

              <div className="space-y-1 border-b border-gray-900 pb-2 mb-2">
                <div className="flex justify-between gap-3"><span>Cashier</span><span>{slip.cashierName || slip.Cashier?.displayName || '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Date Issued</span><span className="text-right">{dateTime(slip.placedAt || slip.createdAt)}</span></div>
                <div className="flex justify-between gap-3"><span>Short Code</span><span>{ticketCode}</span></div>
                <div className="flex justify-between gap-3"><span>Slip Ref</span><span>{String(slip.id || '-').slice(0, 12).toUpperCase()}</span></div>
              </div>

              <div className="space-y-2">
                {rows.length ? rows.map((s: any, index: number) => {
                  const fixture = s?.Outcome?.Market?.Fixture || s?.snapshot?.fixture || {};
                  const league = fixture?.League?.name || fixture?.leagueName || 'Sport';
                  const home = fixture?.homeTeam?.name || fixture?.homeTeamName || '';
                  const away = fixture?.awayTeam?.name || fixture?.awayTeamName || '';
                  const market = s?.Outcome?.Market?.name || s?.snapshot?.market?.name || '';
                  const outcome = s?.Outcome?.name || s?.snapshot?.outcome?.name || '';
                  const odds = Number(s?.oddsAtPlacement || s?.snapshot?.outcome?.displayOdds || s?.snapshot?.outcome?.odds || 1).toFixed(2);
                  return (
                    <div key={s.id || index} className="border-b border-gray-900 pb-2">
                      <div>{league}</div>
                      <div className="text-[11px]">{home} V {away}</div>
                      <div className="text-[11px]">{market}</div>
                      <div className="flex justify-between gap-3 font-black"><span>{outcome}</span><span>{odds}</span></div>
                    </div>
                  );
                }) : (
                  <div className="border-b border-gray-900 pb-2 text-gray-500">No selections found.</div>
                )}
              </div>

              <div className="space-y-1 pt-2 text-[13px] font-black">
                <div className="flex justify-between gap-3 border-b border-gray-900"><span>Total</span><span>{money(slip.stake)} ETB</span></div>
                <div className="flex justify-between gap-3 border-b border-gray-900"><span>Total Odds</span><span>{money(slip.totalOdds)}</span></div>
                <div className="flex justify-between gap-3 border-b border-gray-900"><span>Possible Winning</span><span>{money(slip.potentialPayout)} ETB</span></div>
                <div className="flex justify-between gap-3"><span>Result</span><span>{String(slip.result || 'pending').toUpperCase()}</span></div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
