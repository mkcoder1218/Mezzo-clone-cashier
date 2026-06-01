/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Page } from '../types';
import { useLogin } from '../modules/auth/hooks';

interface SignInProps {
  setCurrentPage: (p: Page) => void;
}

export const SignIn = ({ setCurrentPage }: SignInProps) => {
  const [cashierName, setCashierName] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ displayName: cashierName.trim(), password });
      setCurrentPage('DASHBOARD');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2c353d] flex items-center justify-center p-4 overflow-y-auto">
       <div className="flex flex-col md:flex-row w-full max-w-3xl min-h-[400px] shadow-[0_0_80px_rgba(0,0,0,0.6)] rounded-lg overflow-hidden border border-gray-700/50 animate-in fade-in zoom-in duration-500">
          <div className="w-full md:w-1/2 bg-[#5d5a57] p-8 md:p-12 flex flex-col justify-center gap-8 border-b md:border-b-0 md:border-r border-gray-700/30">
             <h1 className="text-[#d8d8d8] text-xl font-black uppercase tracking-widest border-b-2 border-gray-400/30 pb-1 w-fit">Sign In</h1>
             <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#e0e0e0] font-black uppercase tracking-widest opacity-70">Display Name</label>
                  <input 
                    type="text"
                    placeholder="Cashier 1"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full bg-[#ecf2f8] p-2 text-sm font-bold text-gray-800 focus:outline-none shadow-[inset_0_1px_4px_rgba(0,0,0,0.15)] rounded-sm border-2 border-transparent focus:border-[#4fbfff] transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#e0e0e0] font-black uppercase tracking-widest opacity-70">Password</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#ecf2f8] p-2 text-sm font-bold text-gray-800 focus:outline-none shadow-[inset_0_1px_4px_rgba(0,0,0,0.15)] rounded-sm border-2 border-transparent focus:border-[#4fbfff] transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="bg-[#333c44] border border-gray-600 text-white font-black py-2.5 px-8 text-[11px] uppercase tracking-widest shadow-2xl hover:bg-gray-700 hover:border-[#ffde00] hover:text-[#ffde00] active:scale-95 transition-all w-full md:w-fit disabled:opacity-50"
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Log In'}
                </button>
             </form>
          </div>
          <div className="w-full md:w-1/2 bg-[#2c313a] flex flex-col items-center justify-center p-8 relative overflow-hidden min-h-[200px] md:min-h-0">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
             <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[#ffde00] text-3xl font-black italic tracking-tighter drop-shadow-[0_8px_10px_rgba(0,0,0,0.8)] filter brightness-110">cash box</span>
                <span className="text-gray-500 text-[7px] uppercase font-black tracking-[1em] mt-3 ml-4">Management</span>
             </div>
             <div className="absolute bottom-6 text-[8px] text-gray-600 uppercase tracking-widest font-bold opacity-30">Security v2.4.0 • Encrypted Connection</div>
          </div>
       </div>
    </div>
  );
};
