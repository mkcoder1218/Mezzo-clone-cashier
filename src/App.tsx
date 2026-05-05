/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Types
import { Page } from './types';

// Components
import { Navbar } from './components/Navbar';
import { TicketModal } from './components/TicketModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Finance } from './pages/Finance';
import { Payouts } from './pages/Payouts';
import { TicketPayouts } from './pages/TicketPayouts';
import { Website } from './pages/Website';
import { Bets } from './pages/Bets';
import { Results } from './pages/Results';
import { Support } from './pages/Support';
import { SignIn } from './pages/SignIn';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('SIGN_IN');
  const [user] = useState('Mk4-1');
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserFound, setIsUserFound] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsUserFound(true);
    } else {
      setIsUserFound(false);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isUserFound={isUserFound}
            handleSearch={handleSearch}
            setIsUserFound={setIsUserFound}
            setIsTicketOpen={setIsTicketOpen}
          />
        );
      case 'FINANCE':
        return <Finance />;
      case 'PAYOUTS':
        return <Payouts />;
      case 'TICKET_PAYOUTS':
        return <TicketPayouts />;
      case 'WEBSITE':
        return <Website />;
      case 'BETS':
        return <Bets />;
      case 'RESULTS':
        return <Results />;
      case 'SUPPORT':
        return <Support />;
      case 'SIGN_IN':
        return <SignIn setCurrentPage={setCurrentPage} />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#2c353d] text-gray-100 font-sans selection:bg-[#ffde00] selection:text-black">
      {currentPage !== 'SIGN_IN' && (
        <>
          <Navbar activePage={currentPage} setActivePage={setCurrentPage} user={user} />
          <div className="max-w-[1920px] mx-auto p-4 lg:p-6 h-[calc(100vh-8.5rem)] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      {currentPage === 'SIGN_IN' && renderContent()}

      <TicketModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />
      
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1f282f;
        }
        ::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
    </div>
  );
}
