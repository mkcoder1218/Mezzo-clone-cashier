/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

export const Website = () => {
  return (
    <div className="space-y-6 pt-2">
      <PageHeader title="Website Management" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#3a444d] p-4 rounded-sm border border-gray-700 shadow-xl">
            <p className="text-[9px] text-gray-500 font-black mb-2 uppercase tracking-widest">DepositByPhone</p>
            <div className="flex items-center border border-gray-700 rounded-sm overflow-hidden shadow-inner">
              <input placeholder="User Phone" className="flex-1 bg-white text-gray-800 py-1.5 px-3 text-xs focus:outline-none" />
              <button className="bg-[#4fbfff] hover:bg-[#3dafee] p-1.5 transition-colors"><Search size={14} className="text-white" /></button>
            </div>
          </div>
          <div className="bg-[#3a444d] p-4 rounded-sm border border-gray-700 shadow-xl">
            <p className="text-[9px] text-gray-500 font-black mb-2 uppercase tracking-widest">WithdrawToken</p>
            <div className="flex items-center border border-gray-700 rounded-sm overflow-hidden shadow-inner">
              <input placeholder="Transaction Token" className="flex-1 bg-white text-gray-800 py-1.5 px-3 text-xs focus:outline-none" />
              <button className="bg-[#4fbfff] hover:bg-[#3dafee] p-1.5 transition-colors"><Search size={14} className="text-white" /></button>
            </div>
          </div>
          <div className="bg-[#3a444d] p-4 rounded-sm border border-gray-700 shadow-xl">
            <p className="text-[9px] text-gray-500 font-black mb-2 uppercase tracking-widest">Offline Package</p>
            <div className="flex items-center border border-gray-700 rounded-sm overflow-hidden shadow-inner">
              <input placeholder="Package ID" className="flex-1 bg-white text-gray-800 py-1.5 px-3 text-xs focus:outline-none" />
              <button className="bg-[#4fbfff] hover:bg-[#3dafee] p-1.5 transition-colors"><Search size={14} className="text-white" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
