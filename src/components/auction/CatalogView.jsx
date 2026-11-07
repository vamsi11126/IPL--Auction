import React, { useState, useMemo } from 'react';
import { Search, Trophy } from 'lucide-react';
import { formatCrores } from '../../lib/auctionDisplay';

const CatalogView = ({
   playerCategories,
   activeOverlayTab,
   setActiveOverlayTab
}) => {
   const [searchQuery, setSearchQuery] = useState('');

   const filteredPlayers = useMemo(() => {
      let players = [];
      if (activeOverlayTab === 'upcoming') players = playerCategories.upcoming;
      else if (activeOverlayTab === 'sold') players = playerCategories.sold;
      else if (activeOverlayTab === 'unsold') players = playerCategories.unsold;
      else if (activeOverlayTab === 'leaderboard') {
         players = [...playerCategories.sold].sort((a, b) => (b.bid || 0) - (a.bid || 0));
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return players;

      return players.filter(p =>
         p.name?.toLowerCase().includes(q) ||
         p.role?.toLowerCase().includes(q) ||
         p.country?.toLowerCase().includes(q) ||
         (p.set || '').toLowerCase().includes(q)
      );
   }, [activeOverlayTab, playerCategories, searchQuery]);

   const groupedUpcomingPlayers = useMemo(() => {
      if (activeOverlayTab !== 'upcoming') return null;
      const groups = {};
      filteredPlayers.forEach(p => {
         const setName = p.set || 'General Pool';
         if (!groups[setName]) groups[setName] = [];
         groups[setName].push(p);
      });
      return groups;
   }, [activeOverlayTab, filteredPlayers]);

   return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar w-full max-w-6xl mx-auto space-y-6">
         {/* Top Controls: Search & Tabs */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
               {[
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'sold', label: 'Sold' },
                  { id: 'unsold', label: 'Unsold' },
                  { id: 'leaderboard', label: 'Top Buys' }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveOverlayTab(tab.id)}
                     className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none ${activeOverlayTab === tab.id
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
               <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
               <input
                  type="text"
                  placeholder="Search player, role, set..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
               />
            </div>
         </div>

         {/* Content Area */}
         {filteredPlayers.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
               <h4 className="text-base font-black uppercase text-gray-400 mb-1">No {activeOverlayTab} players found</h4>
               <p className="text-xs text-gray-600">Try adjusting your search query or filter tab.</p>
            </div>
         ) : activeOverlayTab === 'upcoming' ? (
            <div className="space-y-8">
               {Object.entries(groupedUpcomingPlayers || {}).map(([setName, players]) => (
                  <div key={setName} className="space-y-3">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-yellow-400 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                           {setName}
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] text-gray-500 font-bold">{players.length} Players</span>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {players.map(p => (
                           <div key={p.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/[0.05] hover:border-white/15 transition-all flex flex-col justify-between">
                              <div className="text-center">
                                 <div className="w-16 h-16 rounded-xl bg-white/5 mx-auto mb-2 overflow-hidden flex items-center justify-center p-1">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                 </div>
                                 <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                                 <span className="text-[8px] font-bold text-gray-400 uppercase">{p.role}</span>
                              </div>
                              <div className="bg-black/40 rounded-xl py-1 px-2 text-center mt-2 border border-white/5">
                                 <span className="text-[10px] font-black text-yellow-400">₹{formatCrores(p.basePrice)} Cr</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
               {filteredPlayers.map((p, idx) => (
                  <div key={p.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/[0.05] hover:border-white/15 transition-all flex flex-col justify-between relative overflow-hidden">
                     {activeOverlayTab === 'leaderboard' && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-black text-[9px] flex items-center justify-center">
                           #{idx + 1}
                        </div>
                     )}
                     <div className="text-center">
                        <div className="w-16 h-16 rounded-xl bg-white/5 mx-auto mb-2 overflow-hidden flex items-center justify-center p-1">
                           <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <h5 className="text-xs font-bold text-white truncate">{p.name}</h5>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">{p.role} • {p.country}</span>
                     </div>
                     <div className="bg-black/40 rounded-xl py-1 px-2 text-center mt-2 border border-white/5">
                        <span className={`text-[10px] font-black ${activeOverlayTab === 'sold' || activeOverlayTab === 'leaderboard' ? 'text-green-400' : 'text-red-400'}`}>
                           ₹{formatCrores(activeOverlayTab === 'sold' || activeOverlayTab === 'leaderboard' ? p.bid : p.basePrice)} Cr
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};

export default CatalogView;
