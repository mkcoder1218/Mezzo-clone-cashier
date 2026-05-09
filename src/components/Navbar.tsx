/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Maximize2, User, LogOut } from 'lucide-react';
import { Page } from '../types';
import { useMe } from '../modules/auth/hooks';
import { useCashierLimit } from '../modules/cashier/hooks';

interface NavbarProps {
  activePage: Page;
  setActivePage: (p: Page) => void;
  shortCode: string;
  setShortCode: (v: string) => void;
  user?: string; // Keep for legacy
}

export const Navbar = ({ activePage, setActivePage, shortCode, setShortCode }: NavbarProps) => {
  const { data: me } = useMe();
  const { data: limitData } = useCashierLimit();

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

  const handleLogout = () => {
    localStorage.removeItem('cashierToken');
    window.location.reload();
  };

  return (
    <div className="bg-[#1f282f] text-gray-300 border-b border-gray-700/50 sticky top-0 z-40">
      <div className="flex items-center justify-between px-3 sm:px-4 py-1 min-h-10 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col leading-none cursor-pointer" onClick={() => setActivePage('DASHBOARD')}>
            <span className="text-[#ffde00] font-black text-base italic tracking-tighter">mezzo.bet</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase transition-colors tracking-tight ${
                  activePage === item.id 
                    ? 'text-[#ffde00] bg-gray-700/50 shadow-inner' 
                    : 'hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile page selector */}
          <div className="md:hidden">
            <select
              value={activePage}
              onChange={(e) => setActivePage(e.target.value as Page)}
              className="bg-[#3d4852] border border-gray-600 text-[11px] py-1 px-2 rounded-sm text-white focus:outline-none focus:border-[#4fbfff] max-w-[44vw]"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] tracking-tight shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[#3eda3e] font-black uppercase whitespace-nowrap">
              CASHIER: {me?.displayName || me?.phoneNumber || '...'}
            </span>
          </div>
          <span className="text-[#ffde00] font-black uppercase whitespace-nowrap">
            Limit: {limitData?.totalLimit || '0.00'}
          </span>
          <div className="flex items-center gap-3">
            <User size={14} className="text-white cursor-pointer hover:text-[#ffde00]" />
            <LogOut 
              size={14} 
              className="text-gray-500 cursor-pointer hover:text-red-500" 
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#333c44] px-3 sm:px-4 py-2 flex items-center gap-2 border-t border-gray-700/50 flex-wrap">
        {/* Secondary Bar - Kept for UI Consistency */}
        <div className="relative w-full sm:w-48">
          <input 
            placeholder="Event Short Code" 
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
            className="w-full bg-[#3d4852] border border-gray-600 text-[11px] py-1 px-3 pr-8 rounded-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#4fbfff]"
          />
          <Search size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="sm:ml-auto flex items-center gap-1 cursor-pointer hover:text-white transition-colors group">
          <span className="text-[11px] font-black uppercase text-gray-300 tracking-tighter">SECURE CONNECTION</span>
          <div className="bg-white/10 p-0.5 rounded">
            <Maximize2 size={9} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
};
