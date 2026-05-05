/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Maximize2, User, Globe } from 'lucide-react';
import { Page } from '../types';

interface NavbarProps {
  activePage: Page;
  setActivePage: (p: Page) => void;
  user: string;
}

export const Navbar = ({ activePage, setActivePage, user }: NavbarProps) => {
  const navItems: { label: string, id: Page }[] = [
    { label: 'Dashboard', id: 'DASHBOARD' },
    { label: 'Finance', id: 'FINANCE' },
    { label: 'Payouts', id: 'PAYOUTS' },
    { label: 'Ticket Payouts', id: 'TICKET_PAYOUTS' },
    { label: 'Website', id: 'WEBSITE' },
    { label: 'Bets', id: 'BETS' },
    { label: 'Results', id: 'RESULTS' },
    { label: 'Support', id: 'SUPPORT' },
  ];

  return (
    <div className="bg-[#1f282f] text-gray-300 border-b border-gray-700/50 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-1 h-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col leading-none cursor-pointer" onClick={() => setActivePage('DASHBOARD')}>
            <span className="text-[#ffde00] font-black text-base italic tracking-tighter">mezzo.bet</span>
          </div>
          
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase transition-colors tracking-tight ${
                  activePage === item.id 
                    ? 'text-[#ffde00] bg-gray-700/50 shadow-inner' 
                    : 'hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-[8px] tracking-tight">
          <div className="flex items-center gap-3">
            <span className="text-[#3eda3e] font-black uppercase">FRANCHISE: {user}</span>
            <span className="text-[#ffde00] font-black uppercase">Limit: 71025</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
              <div className="w-5 h-3 flex flex-col justify-between border border-gray-600">
                <div className="h-1/2 bg-white"></div>
                <div className="h-1/2 bg-red-600"></div>
              </div>
            </div>
            <User size={14} className="text-white cursor-pointer hover:text-[#ffde00]" />
          </div>
        </div>
      </div>

      <div className="bg-[#333c44] px-4 py-2 flex items-center gap-2 border-t border-gray-700/50">
        <div className="relative w-36">
          <input 
            placeholder="Event Short Code" 
            className="w-full bg-[#3d4852] border border-gray-600 text-[9px] py-1 px-3 pr-8 rounded-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#4fbfff]"
          />
          <Search size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative w-36">
          <select className="w-full bg-[#3d4852] border border-gray-600 text-[9px] py-1 px-3 pr-8 rounded-sm text-white focus:outline-none appearance-none">
            <option>Live</option>
          </select>
          <Search size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative w-36">
          <input 
            placeholder="Event Name" 
            className="w-full bg-[#3d4852] border border-gray-600 text-[9px] py-1 px-3 pr-8 rounded-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#4fbfff]"
          />
          <Search size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="ml-auto flex items-center gap-1 cursor-pointer hover:text-white transition-colors group">
          <span className="text-[9px] font-black uppercase text-gray-300 tracking-tighter">EMPLOYEE LOGIN</span>
          <div className="bg-white/10 p-0.5 rounded">
            <Maximize2 size={9} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
};
