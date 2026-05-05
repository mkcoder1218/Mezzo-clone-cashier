/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageHeader } from '../components/PageHeader';

export const Results = () => {
  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Sports and Games Results">
        <button className="bg-[#4fbfff] text-white px-4 py-1 text-[9px] font-black rounded-sm uppercase tracking-widest hover:bg-[#3dafee] shadow-md transition-all active:scale-95">Print</button>
      </PageHeader>

      <div className="grid grid-cols-7 gap-0 border-b border-gray-700 bg-[#292f36] shadow-lg">
         {['SPORTS', 'KENO', 'DOGS', 'WOF', 'KABOOM', 'HORSES', 'TOTO'].map((tab, i) => (
           <button 
            key={tab} 
            className={`py-3.5 text-[10px] font-black uppercase tracking-wider transition-all ${i === 0 ? 'text-[#ffde00] bg-[#333c44] border-b-2 border-[#ffde00]' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      <div className="overflow-x-auto rounded-sm border border-gray-700 shadow-2xl">
        <table className="w-full text-[8px] text-left bg-[#333c44]">
          <thead className="bg-[#2c353d] text-[#4fbfff] uppercase border-b border-gray-700 font-black tracking-widest">
            <tr>
              <th className="py-2 px-3 border-r border-gray-700/50">Sport</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Competition</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Date</th>
              <th className="py-2 px-3 border-r border-gray-700/50">Event</th>
              <th className="py-2 px-3">R</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-gray-400 font-black">
            {[
              { s: 'Basketball', c: 'World - IPBL - Prime Division', d: '05-05 13:00', e: 'Bears V Octopus', r: '114-134,(38-32)(26-29)(27-35)(23-38)' },
              { s: 'Table Tennis', c: 'Russia - Moscow Liga Pro', d: '05-05 13:45', e: 'Alexander Kuzmin V Sergey Petrushov', r: '3-0,(11-7)(11-2)(11-6)' },
              { s: 'Basketball', c: 'Russia - IPBL Pro Division', d: '05-05 13:10', e: 'Belgorod V Saratov', r: '84-95,(20-24)(20-19)(23-19)(21-33)' },
              { s: 'Football', c: 'Bangladesh - Federation Cup', d: '05-05 11:45', e: 'Brothers Union V Bashundhara Kings', r: '0-4,(0-1)(0-3)' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-gray-700/50 transition-colors uppercase">
                <td className="py-2 px-3 border-r border-gray-700/50">{row.s}</td>
                <td className="py-2 px-3 border-r border-gray-700/50">{row.c}</td>
                <td className="py-2 px-3 border-r border-gray-700/50">{row.d}</td>
                <td className="py-2 px-3 border-r border-gray-700/50">{row.e}</td>
                <td className="py-2 px-3 font-mono text-[#ffde00]">{row.r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
