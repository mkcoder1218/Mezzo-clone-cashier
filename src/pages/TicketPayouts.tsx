/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

export const TicketPayouts = () => {
  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Package ID" />
      <div className="bg-[#3a444d] p-6 rounded-sm border border-gray-700 shadow-2xl max-w-xl mx-auto mt-8">
        <p className="text-[9px] text-gray-500 font-black mb-3 uppercase tracking-widest">Search (Payouts FreeBet Cashout)</p>
        <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d] shadow-inner overflow-hidden">
          <input 
            placeholder="Package ID"
            className="flex-1 bg-white text-gray-800 py-1.5 px-3 text-xs font-medium focus:outline-none placeholder-gray-400"
          />
          <button className="bg-[#4fbfff] hover:bg-[#3dafee] p-2 transition-all">
            <Search size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
