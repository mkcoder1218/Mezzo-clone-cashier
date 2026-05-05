/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Settings, MessageSquare } from 'lucide-react';

export const Support = () => {
  return (
    <div className="flex h-[calc(100vh-12rem)] bg-[#2c353d] border border-gray-700 rounded-sm overflow-hidden shadow-2xl">
      <div className="w-64 bg-[#1f282f] border-r border-gray-700 p-5 space-y-6">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[10px] uppercase font-black tracking-widest">Channels</span>
          <div className="flex gap-3">
            <Search size={14} className="cursor-pointer hover:text-white transition-colors" />
            <Settings size={14} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { name: '# fixtures_MEZZO', count: 17 },
            { name: '# support_MEZZO', count: 183 },
            { name: '# SHOP_Mk4_MEZZO', count: 0 },
          ].map((channel, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-sm hover:bg-gray-800 cursor-pointer group border border-transparent hover:border-gray-700 transition-all">
              <span className="text-xs text-gray-400 font-bold group-hover:text-white transition-colors uppercase tracking-tight">{channel.name}</span>
              {channel.count > 0 && (
                <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg">{channel.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-[#333c44]/20">
        <div className="p-12 border-2 border-dashed border-gray-700/50 rounded-2xl flex flex-col items-center opacity-40 shadow-inner group hover:opacity-60 transition-opacity">
           <div className="bg-[#1f282f] p-4 rounded-full mb-6 border border-gray-700 group-hover:scale-110 transition-transform">
             <MessageSquare size={44} className="text-gray-500" />
           </div>
           <h2 className="text-lg font-black text-gray-400 uppercase tracking-tighter mb-2">Support Chat</h2>
           <p className="text-[9px] text-gray-500 italic uppercase font-black tracking-widest">Powered by mezzo.bet Internal Support System</p>
           <span className="text-[8px] text-gray-600 mt-10 bg-gray-800/50 px-4 py-1.5 rounded-full uppercase tracking-widest">Select a channel to start chatting</span>
        </div>
      </div>
    </div>
  );
};
