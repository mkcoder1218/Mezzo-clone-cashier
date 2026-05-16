/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Maximize2, User, LogOut, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
    <div className="bg-[#1f282f] text-gray-300 border-b border-gray-700 sticky top-0 z-40 shadow-lg">
      {/* Row 1: Logo, Nav, Status */}
      <div className="flex items-center justify-between px-4 py-2 min-h-12 relative">
        <div className="flex items-center gap-3 lg:gap-8 min-w-0">
          <button 
            className="lg:hidden p-1 text-gray-100 shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="cursor-pointer shrink-0" onClick={() => setActivePage('DASHBOARD')}>
            <span className="text-[#ffde00] font-black text-xl lg:text-2xl italic tracking-tighter">kingsbet</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`text-sm font-bold uppercase transition-colors tracking-tight ${
                  activePage === item.id 
                    ? 'text-[#ffde00]' 
                    : 'text-gray-100 hover:text-[#ffde00]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Nav Menu Overlay */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#1f282f] border-b border-gray-700 lg:hidden shadow-2xl flex flex-col p-4 gap-2 animate-in fade-in slide-in-from-top-2 z-50">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsMenuOpen(false);
                }}
                className={`text-left py-3 px-4 rounded-sm text-sm font-black uppercase transition-colors tracking-widest ${
                  activePage === item.id 
                    ? 'bg-[#ffde00] text-black' 
                    : 'bg-[#2c353d] text-gray-100 hover:text-[#ffde00]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="h-[1px] bg-gray-700 my-2" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 text-left py-3 px-4 rounded-sm text-sm font-black uppercase text-red-400 bg-[#2c353d]"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 lg:gap-8 text-[9px] lg:text-xs font-bold shrink-0">
          <div className="hidden xs:flex flex-col items-end leading-tight">
            <span className="text-[#3eda3e] uppercase tracking-wider font-black whitespace-nowrap">
              FRANCHISE: MK4-1
            </span>
            <span className="text-[#ffde00] uppercase tracking-wider font-black whitespace-nowrap">
              Limit: {limitData?.totalLimit || '0'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4 text-gray-100">
            <button 
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className="lg:hidden p-1.5 bg-[#333c44] rounded-sm text-[#ffde00] border border-gray-600 shadow-sm mr-1"
            >
              {isSearchExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className="hidden sm:flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-6 h-4 bg-blue-600 relative overflow-hidden flex flex-col">
                <div className="h-full bg-red-600 w-1/3 self-center"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              <User size={18} className="cursor-pointer hover:text-[#ffde00]" />
              <LogOut 
                size={18} 
                className="cursor-pointer hover:text-red-500 hidden lg:block" 
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Search Boxes, Employee Login - Toggleable on mobile */}
      <div className={`bg-[#333c44] px-4 py-2.5 flex-col lg:flex-row items-center justify-between border-t border-gray-700/30 gap-4 ${isSearchExpanded ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:max-w-3xl">
          <div className="relative w-full sm:flex-1">
            <input 
              placeholder="Event Short Code" 
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              className="w-full bg-[#1f282f] border border-gray-600 text-sm py-2 px-3 pr-9 rounded-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#ffde00]"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-100" />
          </div>
          <div className="relative w-full sm:flex-1">
            <input 
              placeholder="Live" 
              className="w-full bg-[#1f282f] border border-gray-600 text-sm py-2 px-3 pr-9 rounded-sm text-white placeholder-gray-400 focus:outline-none"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-100" />
          </div>
          <div className="relative w-full sm:flex-1">
            <input 
              placeholder="Event Name" 
              className="w-full bg-[#1f282f] border border-gray-600 text-sm py-2 px-3 pr-9 rounded-sm text-white placeholder-gray-400 focus:outline-none"
            />
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-100" />
          </div>
        </div>
        
        <button className="flex items-center gap-2 text-xs font-black uppercase text-white hover:text-[#ffde00] transition-colors bg-[#1f282f] px-4 py-2 rounded-sm border border-gray-600 w-full lg:w-auto justify-center">
          <span>Employee Login</span>
          <User size={14} />
        </button>
      </div>
    </div>
  );
};
