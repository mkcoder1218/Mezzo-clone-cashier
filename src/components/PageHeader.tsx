/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const PageHeader = ({ title, children }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h1 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h1>
        {children}
      </div>
      <button className="bg-[#333c44] p-1 rounded border border-gray-700 hover:bg-gray-700 transition-colors">
        <FileText size={11} className="text-white" />
      </button>
    </div>
  );
};
