/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketModal = ({ isOpen, onClose }: TicketModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#2c353d] w-80 shadow-2xl rounded-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#333c44] flex items-center justify-between px-3 py-1.5 border-b border-gray-700">
          <div className="flex gap-3">
            <span className="text-white text-[9px] font-black border-b border-[#ffde00] pb-0.5 uppercase tracking-tighter">Print Preview</span>
            <span className="text-gray-400 text-[9px] font-black uppercase tracking-tighter">Ticket Info</span>
          </div>
          <X size={12} className="text-white cursor-pointer hover:text-[#ffde00]" onClick={onClose} />
        </div>
        
        <div className="p-3 bg-white flex flex-col items-center">
          <div className="border border-gray-800 rounded-lg p-2 w-full flex flex-col items-center text-gray-800 mb-3 bg-white shadow-sm">
            <span className="text-lg font-black italic tracking-tighter mb-0 leading-none">mezzo</span>
            <span className="text-lg font-black italic tracking-tighter mt-0 leading-none border-t border-gray-800 w-full text-center">bet</span>
          </div>
          
          <div className="w-full space-y-0.5 text-[8px] font-black text-gray-800 uppercase tracking-tight">
            <p className="border-b border-gray-100 pb-0.5">Website Deposit</p>
            <p className="border-b border-gray-100 pb-0.5">Phone: +251933894492</p>
            <p className="border-b border-gray-100 pb-0.5">Amount: 50.00</p>
            <p className="pt-0.5 text-gray-500">Date issued: 2026-05-05 14:07</p>
          </div>
        </div>

        <div className="bg-[#333c44] p-1.5 flex justify-start">
          <button className="bg-white text-gray-800 px-3 py-1 text-[8px] font-black rounded-sm shadow-inner hover:bg-gray-100 uppercase transition-colors tracking-tighter">
            Print
          </button>
        </div>
      </div>
    </div>
  );
};
