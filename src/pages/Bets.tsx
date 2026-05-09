/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { useMyPlacedBets } from '../modules/bets/hooks';

export const Bets = () => {
  const { data: slips, isLoading } = useMyPlacedBets();

  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Bets" />

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
              <th className="py-2 px-3">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-300">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 font-black">
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
                  <td className="py-2 px-3">{s.payout || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400 font-black">
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
