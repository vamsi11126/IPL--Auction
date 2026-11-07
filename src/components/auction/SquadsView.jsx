import React, { useState } from 'react';
import { TEAMS } from '../../data/teams';
import { IPL_PLAYERS } from '../../data/players';
import { formatCrores, toFiniteNumber, countOverseas, computeTeamSpent } from '../../lib/auctionDisplay';

const ROLES = ['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'];

const SquadsView = ({
   roomTeams,
   currentAuction,
   user,
   liveTeamRatings,
   selectedTeamId,
   setSelectedTeamId
}) => {
   const teamsList = liveTeamRatings?.rankedTeams || TEAMS;
   const activeTeam = teamsList.find(t => t.id === selectedTeamId) || teamsList[0];
   const activeTeamDoc = roomTeams.find(doc => doc.teamId === activeTeam.id);
   const manager = currentAuction?.players?.find(p => p.id === activeTeamDoc?.userId);
   const isMyTeam = manager?.id === user?.uid;
   const ratingInfo = liveTeamRatings?.ratingMap[activeTeam.id];

   const squadWithDetails = (activeTeamDoc?.squad || []).map(s => {
      const pid = typeof s === 'string' ? s : s.id;
      const bidVal = typeof s === 'string' ? null : s.bid;
      const pInfo = IPL_PLAYERS.find(pl => pl.id === pid);
      return { ...pInfo, bidVal };
   });

   return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar w-full max-w-6xl mx-auto space-y-6">
         {/* Top Franchise Selector Strip */}
         <div>
            <div className="flex items-center justify-between mb-3">
               <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">Franchise Squads</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select a franchise to inspect their roster and purse</p>
               </div>
               <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  10 Franchises
               </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
               {teamsList.map((t) => {
                  const tDoc = roomTeams.find(d => d.teamId === t.id);
                  const isSelected = activeTeam.id === t.id;
                  const purse = tDoc?.budgetRemaining ?? toFiniteNumber(currentAuction?.settings?.budget, 120);

                  return (
                     <button
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                           ? 'bg-yellow-500/15 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] scale-102'
                           : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                           }`}
                     >
                        <div className="w-10 h-10 rounded-xl bg-white/5 p-1 flex items-center justify-center mb-1">
                           <img src={t.logo} alt={t.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase">{t.id}</span>
                        <span className="text-[8px] font-bold text-gray-400">₹{formatCrores(purse, 0)}Cr</span>
                     </button>
                  );
               })}
            </div>
         </div>

         {/* Selected Team Header Card */}
         <div className="bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
               <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-2xl p-2 shrink-0 flex items-center justify-center shadow-lg">
                  <img src={activeTeam.logo} alt={activeTeam.name} className="w-full h-full object-contain" />
               </div>
               <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                     <h3 className="text-xl sm:text-2xl font-black text-white uppercase">{activeTeam.name}</h3>
                     {isMyTeam && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase rounded-full">
                           Your Team
                        </span>
                     )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                     Manager: <strong className="text-white">{manager?.name || 'Available / Bot'}</strong>
                  </p>
               </div>
            </div>

            {/* Financial & Squad Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
               <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Purse Left</span>
                  <span className="text-base sm:text-lg font-black text-green-400">
                     ₹{formatCrores(activeTeamDoc?.budgetRemaining ?? toFiniteNumber(currentAuction?.settings?.budget, 120), 1)} Cr
                  </span>
               </div>
               <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Total Spent</span>
                  <span className="text-base sm:text-lg font-black text-yellow-400">
                     ₹{formatCrores(computeTeamSpent({
                        budget: toFiniteNumber(currentAuction?.settings?.budget, 120),
                        budgetRemaining: activeTeamDoc?.budgetRemaining,
                        spent: activeTeamDoc?.spent,
                     }), 1)} Cr
                  </span>
               </div>
               <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Squad Count</span>
                  <span className="text-base sm:text-lg font-black text-blue-400">
                     {activeTeamDoc?.squad?.length || 0} / {toFiniteNumber(currentAuction?.squadLimit, 25)}
                  </span>
               </div>
               <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Overseas</span>
                  <span className="text-base sm:text-lg font-black text-purple-400">
                     {countOverseas(activeTeamDoc?.squad, IPL_PLAYERS)} / {toFiniteNumber(currentAuction?.overseasLimit, 8)}
                  </span>
               </div>
            </div>
         </div>

         {/* Squad Members by Category */}
         {squadWithDetails.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No players bought by {activeTeam.name} yet</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {ROLES.map(role => {
                  const rolePlayers = squadWithDetails.filter(p => p.role === role);
                  return (
                     <div key={role} className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{role}s</span>
                           <span className="px-2 py-0.5 bg-white/5 text-gray-300 text-[9px] font-black rounded-full">
                              {rolePlayers.length}
                           </span>
                        </div>

                        {rolePlayers.length === 0 ? (
                           <div className="py-6 text-center text-gray-600 text-[10px] uppercase font-bold">
                              None
                           </div>
                        ) : (
                           <div className="space-y-2">
                              {rolePlayers.map((p, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/5">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                       <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-contain bg-white/5 shrink-0" />
                                       <div className="truncate">
                                          <span className="text-[11px] font-bold text-white block truncate">{p.name}</span>
                                          <span className="text-[8px] text-gray-500 uppercase">{p.country}</span>
                                       </div>
                                    </div>
                                    <span className="text-[10px] font-black text-yellow-400 shrink-0">
                                       {p.bidVal == null ? '—' : `₹${formatCrores(p.bidVal)} Cr`}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};

export default SquadsView;
