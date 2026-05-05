/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageHeader } from '../components/PageHeader';

export const Finance = () => {
  return (
    <div className="space-y-6 pt-2">
      <PageHeader title="Finance" />
      <div className="flex items-center gap-2 bg-[#2c353d] p-2 border-b border-gray-700 shadow-lg mb-4">
        <button className="bg-white text-black px-4 py-1.5 text-[9px] font-black rounded-sm uppercase tracking-tighter hover:bg-gray-100 transition-colors">Cash In</button>
        <button className="bg-white text-black px-4 py-1.5 text-[9px] font-black rounded-sm uppercase tracking-tighter hover:bg-gray-100 transition-colors">Cash Out</button>
        <button className="bg-white text-black px-4 py-1.5 text-[9px] font-black rounded-sm uppercase tracking-tighter ml-auto hover:bg-gray-100 transition-colors">Balance Logs</button>
      </div>
      <div className="overflow-x-auto rounded-sm border border-gray-700 shadow-2xl">
        <table className="w-full text-left bg-[#333c44]">
          <thead className="bg-[#292f36] border-b border-gray-700">
            <tr className="text-[9px] uppercase text-[#4fbfff] font-black tracking-widest">
              <th className="py-2.5 px-3 border-r border-gray-700/50">Username</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">In</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Out</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Other In</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Other Out</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Debt</th>
              <th className="py-2.5 px-3">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {/* Empty state */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
