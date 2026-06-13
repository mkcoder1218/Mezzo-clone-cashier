/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import { api } from '../lib/api';

export const Results = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string) => void }) => {
  const [activeTab] = React.useState<'SPORTS' | 'KENO' | 'DOGS' | 'WOF' | 'KABOOM' | 'HORSES' | 'TOTO'>('SPORTS');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'finished'>('finished');
  const [page, setPage] = React.useState(1);
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [cashboxToken, setCashboxToken] = React.useState('');
  const [dtFrom, setDtFrom] = React.useState(today);
  const [dtTill, setDtTill] = React.useState(today);
  const queryClient = useQueryClient();
  const limit = 10;
  const offset = (page - 1) * limit;

  const resultsQuery = useQuery({
    queryKey: ['results', { activeTab, searchQuery, page, statusFilter, dtFrom, dtTill }],
    queryFn: async () => {
      const { data } = await api.get('/results', {
        params: {
          limit,
          offset,
          q: searchQuery || undefined,
          status: statusFilter === 'finished' ? 'finished' : undefined,
          dtFrom: dtFrom || undefined,
          dtTill: dtTill || undefined
        }
      });
      return data as { count: number; rows: any[] };
    },
    enabled: activeTab === 'SPORTS',
    staleTime: 10_000
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/results/sync', {
        token: cashboxToken.trim() || undefined,
        dt_from: dtFrom,
        dt_till: dtTill,
        type: 'sports',
        what: 'results'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
    }
  });

  const rows = resultsQuery.data?.rows || [];
  const count = resultsQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab, statusFilter, dtFrom, dtTill]);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    // "MM-DD HH:mm"
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  };

  return (
    <div className="space-y-4 pt-2">
      <PageHeader title="Sports and Games Results">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search (team, league, country, sport)..."
          className="ml-3 w-[320px] max-w-[45vw] bg-[#1f282f] border border-gray-700 text-gray-100 placeholder-gray-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-[#4fbfff]"
        />
        <div className="ml-2 flex items-center gap-1">
          <button
            onClick={() => setStatusFilter('finished')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-gray-700 ${
              statusFilter === 'finished' ? 'bg-[#333c44] text-[#ffde00]' : 'bg-[#1f282f] text-gray-400 hover:text-white'
            }`}
          >
            Finished
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-gray-700 ${
              statusFilter === 'all' ? 'bg-[#333c44] text-[#ffde00]' : 'bg-[#1f282f] text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>
        <button className="bg-[#4fbfff] text-white px-4 py-1 text-[9px] font-black rounded-sm uppercase tracking-widest hover:bg-[#3dafee] shadow-md transition-all active:scale-95">Print</button>
      </PageHeader>

      <div className="bg-[#1f282f] border border-gray-700 p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[#ffde00] text-[10px] font-black uppercase tracking-widest italic">Cashbox Results Sync</h2>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">API: https://cashbox.kingsbet.com</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Cashbox Auth Token</label>
            <input 
              value={cashboxToken}
              onChange={(e) => setCashboxToken(e.target.value)}
              placeholder="Optional: override system default token..."
              className="w-full bg-[#161d23] border border-gray-700 text-gray-100 px-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-[#ffde00]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">From</label>
            <input 
              type="date"
              value={dtFrom}
              onChange={(e) => setDtFrom(e.target.value)}
              className="w-full bg-[#161d23] border border-gray-700 text-gray-100 px-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-[#ffde00]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Till</label>
            <input 
              type="date"
              value={dtTill}
              onChange={(e) => setDtTill(e.target.value)}
              className="w-full bg-[#161d23] border border-gray-700 text-gray-100 px-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-[#ffde00]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-700/50">
          <button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !dtFrom || !dtTill}
            className="flex items-center gap-2 bg-[#ffde00] text-black px-6 py-2 text-[10px] font-black uppercase italic tracking-widest hover:bg-[#e6c800] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,222,0,0.2)]"
          >
            <RefreshCcw size={12} className={syncMutation.isPending ? 'animate-spin' : ''} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Results'}
          </button>
        </div>
        {syncMutation.isError && <p className="text-red-400 text-[8px] font-black uppercase text-right">Sync failed. Check token and connection.</p>}
        {syncMutation.isSuccess && <p className="text-green-400 text-[8px] font-black uppercase text-right">Sync completed successfully.</p>}
      </div>

      <div className="grid grid-cols-7 gap-0 border-b border-gray-700 bg-[#292f36] shadow-lg">
         {['SPORTS', 'KENO', 'DOGS', 'WOF', 'KABOOM', 'HORSES', 'TOTO'].map((tab, i) => (
           <button 
            key={tab} 
            disabled={tab !== 'SPORTS'}
            className={`py-3.5 text-[10px] font-black uppercase tracking-wider transition-all ${
              tab === 'SPORTS' ? 'text-[#ffde00] bg-[#333c44] border-b-2 border-[#ffde00]' : 'text-gray-600 opacity-50 cursor-not-allowed'
            }`}
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
            {resultsQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400 uppercase tracking-widest">Loading...</td>
              </tr>
            ) : resultsQuery.isError ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-red-300 uppercase tracking-widest">Failed to load results</td>
              </tr>
            ) : rows.length ? (
              rows.map((row: any) => {
                const sport = row.Sport?.name || '-';
                const leagueCountry = row.League?.country ? `${row.League.country} - ` : '';
                const league = `${leagueCountry}${row.League?.name || '-'}`;
                const date = row.startsAt ? fmtDate(row.startsAt) : '-';
                const event = `${row.homeTeam?.name || '-'} V ${row.awayTeam?.name || '-'}`;
                const score = row.externalScoreRaw || (row.homeScore != null && row.awayScore != null ? `${row.homeScore}-${row.awayScore}` : '-');

                return (
                  <tr key={row.id} className="hover:bg-gray-700/50 transition-colors uppercase">
                    <td className="py-2 px-3 border-r border-gray-700/50">{sport}</td>
                    <td className="py-2 px-3 border-r border-gray-700/50">{league}</td>
                    <td className="py-2 px-3 border-r border-gray-700/50">{date}</td>
                    <td className="py-2 px-3 border-r border-gray-700/50">{event}</td>
                    <td className="py-2 px-3 font-mono text-[#ffde00]">{score}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400 uppercase tracking-widest">No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
        <div>Showing {rows.length} of {count}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-gray-700 bg-[#292f36] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <div className="min-w-[72px] text-center">
            {page} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-700 bg-[#292f36] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
