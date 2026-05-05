/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageHeader } from '../components/PageHeader';

export const Payouts = () => {
  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Payouts" />
      <div className="flex items-center justify-center gap-4 py-6 border-b border-gray-700 bg-[#333c44]/30 rounded-sm">
        <select className="bg-[#2c353d] border border-gray-600 text-white text-[11px] px-3 py-1.5 rounded-sm focus:outline-none focus:border-[#4fbfff]">
          <option>Mk4-1</option>
        </select>
        <button className="bg-white text-black px-4 py-1.5 text-[11px] font-black rounded-sm uppercase tracking-tighter hover:bg-gray-200 transition-all active:scale-95 shadow-md">Fetch</button>
      </div>
      
      <div className="grid grid-cols-8 gap-0 border-b border-gray-700 bg-[#292f36] shadow-lg">
         {['SPORTS', 'KENO', 'DOGS', 'WOF', 'KABOOM', 'HORSES', 'TOTO', 'VF'].map((tab, i) => (
           <button 
            key={tab} 
            className={`py-3 text-[9px] font-black uppercase transition-all tracking-wider ${i === 0 ? 'text-[#ffde00] bg-[#333c44] border-b-2 border-[#ffde00]' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      <div className="text-right p-3 flex justify-end gap-6 text-[9px] font-black text-gray-300 uppercase tracking-tighter">
         <span className="bg-gray-800 px-3 py-1 rounded-sm border border-gray-700">Summa - <span className="text-[#ffde00]">0</span></span>
         <span className="bg-gray-800 px-3 py-1 rounded-sm border border-gray-700">Total - <span className="text-[#ffde00]">0</span></span>
      </div>

      <div className="overflow-x-auto rounded-sm border border-gray-700 shadow-2xl">
        <table className="w-full text-[9px] text-left bg-[#333c44]">
          <thead className="bg-[#2c353d] text-[#4fbfff] uppercase border-b border-gray-700 font-black tracking-widest">
            <tr>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Date of admission</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Package ID</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Type</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Amount</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Payout Sum</th>
              <th className="py-2.5 px-3 border-r border-gray-700/50">Paid Sum</th>
              <th className="py-2.5 px-3">Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-300">
            {/* Empty state */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
