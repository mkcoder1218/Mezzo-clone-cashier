/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, User } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface DashboardProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  isUserFound: boolean;
  handleSearch: () => void;
  setIsUserFound: (v: boolean) => void;
  setIsTicketOpen: (v: boolean) => void;
}

export const Dashboard = ({
  searchQuery,
  setSearchQuery,
  isUserFound,
  handleSearch,
  setIsUserFound,
  setIsTicketOpen
}: DashboardProps) => {
  return (
    <div className="space-y-6 pt-2">
      <PageHeader title="Statistics" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 items-start bg-[#333c44] p-3 rounded-sm border border-gray-700/50">
        <div className="flex items-center justify-between col-span-full mb-3 border-b border-gray-700 pb-1.5 font-black uppercase tracking-widest text-[8px] text-gray-400">
           <span>Stat Summary</span>
           <div className="flex items-center gap-1">
            <span className="text-white bg-gray-600 px-1.5 py-0.5 rounded-l-sm">Revenue</span>
            <span className="bg-red-600 px-1.5 py-0.5 text-white rounded-r-sm">0</span>
          </div>
        </div>

        {[
          { label: 'Sport tickets count:', value: 0 },
          { label: 'Sport tickets amount:', value: 0 },
          { label: 'Sport payout count:', value: 0 },
          { label: 'Sport payout amount:', value: 0 },
          { label: 'Number of deposits:', value: 0 },
          { label: 'Amount of deposits:', value: 0 },
          { label: 'Number of withdrawals:', value: 0 },
          { label: 'Amount of withdrawals:', value: 0 },
        ].map((stat, i) => (
          <div key={i} className="flex justify-between items-center py-0.5 border-b border-gray-700/30">
            <span className="text-[9px] text-gray-400 font-black uppercase tracking-tight">{stat.label}</span>
            <span className="text-[9px] font-black text-[#ffde00]">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-1">DEPOSIT</h2>
            <div className="bg-[#3a444d] p-3 rounded-sm border border-gray-700 shadow-lg">
              <p className="text-[9px] text-gray-500 font-black mb-1.5 uppercase tracking-widest">Deposit (search by ID, phone number or username)</p>
              <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
                <input 
                  placeholder="User Phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-white text-gray-800 py-1 px-2 text-xs focus:outline-none"
                />
                <button onClick={handleSearch} className="bg-[#4fbfff] hover:bg-[#3dafee] p-1 transition-colors">
                  <Search size={14} className="text-white" />
                </button>
              </div>
            </div>

            <div className="bg-[#3a444d] p-3 rounded-sm border border-gray-700 shadow-lg">
              <p className="text-[9px] text-gray-500 font-black mb-1.5 uppercase tracking-widest">Withdraw</p>
              <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
                <input 
                  placeholder="Transaction Token"
                  onKeyDown={(e) => e.key === 'Enter' && setIsUserFound(true)}
                  className="flex-1 bg-white text-gray-800 py-1 px-2 text-xs focus:outline-none"
                />
                <button onClick={() => setIsUserFound(true)} className="bg-[#4fbfff] hover:bg-[#3dafee] p-1 transition-colors">
                  <Search size={14} className="text-white" />
                </button>
              </div>
            </div>

            <div className="bg-[#3a444d] p-3 rounded-sm border border-gray-700 shadow-lg">
              <p className="text-[9px] text-gray-500 font-black mb-1.5 uppercase tracking-widest">Offline Ticket</p>
              <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
                <input 
                  placeholder="Package ID"
                  onKeyDown={(e) => e.key === 'Enter' && setIsUserFound(true)}
                  className="flex-1 bg-white text-gray-800 py-1 px-2 text-xs focus:outline-none"
                />
                <button onClick={() => setIsUserFound(true)} className="bg-[#4fbfff] hover:bg-[#3dafee] p-1 transition-colors">
                  <Search size={14} className="text-white" />
                </button>
              </div>
            </div>
        </div>

        <div className="space-y-4">
          {isUserFound ? (
            <>
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-1 opacity-0">USER</h2>
              <div className="bg-[#3a444d] p-4 rounded-sm border border-gray-700 shadow-lg min-h-[250px]">
                <h3 className="text-[10px] font-black text-gray-200 border-b border-gray-700 pb-2 mb-4 uppercase">User</h3>
                <div className="space-y-2 mb-8">
                  <p className="text-[10px]"><span className="text-gray-400 font-black uppercase">Name -</span> <span className="text-white font-black ml-2">{searchQuery || '+251933894492'}</span></p>
                  <p className="text-[10px]"><span className="text-gray-400 font-black uppercase">Email -</span> <span className="text-white font-black ml-2"></span></p>
                  <p className="text-[10px]"><span className="text-gray-400 font-black uppercase">Username -</span> <span className="text-white font-black ml-2">{searchQuery || '+251933894492'}</span></p>
                  <p className="text-[9px]"><span className="text-[#ffde00] font-black uppercase ml-0">Balance - </span> <span className="text-white font-black text-xs ml-2">0</span></p>
                </div>
                
                <div className="bg-[#2c353d] border border-gray-600 rounded-sm p-0.5 flex items-center shadow-inner">
                  <div className="bg-[#4fbfff] text-white text-[8px] font-black px-2 py-1.5 rounded-sm uppercase tracking-tighter shrink-0 border-r border-[#3dafee]">
                    CASH IN -
                  </div>
                  <input type="text" defaultValue="30" className="bg-transparent text-white font-black text-xs w-full focus:outline-none px-2" />
                  <button onClick={() => setIsTicketOpen(true)} className="bg-[#4fbfff] hover:bg-[#3dafee] text-white text-[8px] font-black px-3 py-1.5 rounded-sm uppercase transition-all active:scale-95">
                    FILL
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-700 rounded-sm opacity-20">
              <User size={64} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-1">Package ID</h2>
        <div className="bg-[#3a444d] p-4 rounded-sm border border-gray-700 shadow-lg max-w-2xl">
          <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">Search (Payouts FreeBet Cashout)</p>
          <div className="flex items-center border border-gray-700 rounded-sm bg-[#2c353d]">
            <input placeholder="Package ID" className="flex-1 bg-white text-gray-800 py-1.5 px-3 text-sm focus:outline-none" />
            <button className="bg-[#4fbfff] hover:bg-[#3dafee] p-1.5 transition-colors">
              <Search size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
