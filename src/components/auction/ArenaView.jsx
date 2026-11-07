import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Pause, Gavel, Shield, Trophy } from 'lucide-react';
import { TEAMS } from '../../data/teams';
import { TEAM_SLOGANS } from '../../data/slogans';
import { IPL_PLAYERS } from '../../data/players';
import { formatCrores, toFiniteNumber, countOverseas } from '../../lib/auctionDisplay';

const ArenaView = ({
   currentPlayer,
   displayAuctionState,
   team,
   currentAuction,
   user,
   spectateMode,
   isTimerPaused,
   inLastCall,
   secondsRemaining,
   timerPercent,
   nextBidAmount,
   handleBid,
   isBiddingInFlight
}) => {
   const isSold = displayAuctionState?.status === 'sold';
   const isUnsold = displayAuctionState?.status === 'unsold';
   const isLeadingBidder = displayAuctionState?.highBidderId === user?.uid;
   const leadingTeam = TEAMS.find(t => t.id === displayAuctionState?.highBidderTeamId);

   // Role-focused 2 key stats for maximum clarity & zero cognitive clutter
   const getKeyStats = (player) => {
      const stats = player?.stats || {};
      const role = player?.role?.toLowerCase() || '';

      if (role.includes('bowl')) {
         return [
            { label: 'Wickets', value: stats.wickets ?? '—', color: 'text-green-400' },
            { label: 'Economy', value: stats.econ ?? '—', color: 'text-cyan-400' },
         ];
      }
      if (role.includes('all')) {
         return [
            { label: 'Runs', value: stats.runs ?? '—', color: 'text-yellow-400' },
            { label: 'Wickets', value: stats.wickets ?? '—', color: 'text-green-400' },
         ];
      }
      if (role.includes('keeper')) {
         return [
            { label: 'Runs', value: stats.runs ?? '—', color: 'text-yellow-400' },
            { label: 'Dismissals', value: stats.matches ?? '—', color: 'text-orange-400' },
         ];
      }
      // Default: Batsman
      return [
         { label: 'Runs', value: stats.runs ?? '—', color: 'text-yellow-400' },
         { label: 'Strike Rate', value: stats.sr ?? '—', color: 'text-purple-400' },
      ];
   };

   const keyStats = getKeyStats(currentPlayer);

   return (
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center justify-between custom-scrollbar w-full max-w-4xl mx-auto">
         {/* Live Status Sub-Header Bar */}
         <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-2xl mb-4 shrink-0">
            <div className="flex items-center gap-2">
               <span className="px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-extrabold text-[9px] uppercase tracking-widest rounded-full">
                  {currentPlayer?.set || 'Pool Player'}
               </span>
               <span className="text-[10px] text-gray-400 uppercase font-bold">
                  Base: <strong className="text-white">₹{formatCrores(currentPlayer?.basePrice)} Cr</strong>
               </span>
            </div>

            <div className="flex items-center gap-2">
               {isSold && (
                  <span className="px-2.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-black uppercase tracking-wider rounded-full animate-pulse">
                     SOLD
                  </span>
               )}
               {isUnsold && (
                  <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase tracking-wider rounded-full animate-pulse">
                     UNSOLD
                  </span>
               )}
               <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1.5">
                  High Bidder:
                  <span className="px-2 py-0.5 rounded-md bg-white/5 font-black text-green-400 max-w-[130px] truncate">
                     {displayAuctionState?.highBidderName || 'None'}
                  </span>
               </span>
            </div>
         </div>

         {/* Main Player Display Area */}
         <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[360px]">
            <AnimatePresence mode="wait">
               {(isSold || isUnsold) ? (
                  <motion.div
                     key="celebration-card"
                     initial={{ opacity: 0, scale: 0.95, y: 15 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="w-full max-w-md mx-auto"
                  >
                     <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-[#0A0A0B] border border-white/15 p-6 shadow-2xl text-center">
                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${isSold && leadingTeam ? leadingTeam.color?.replace('bg-', 'from-') : 'from-red-600'} to-black pointer-events-none`} />

                        <div className="relative z-10 flex flex-col items-center gap-3">
                           {isSold && leadingTeam ? (
                              <div className="w-16 h-16 bg-white/10 rounded-2xl p-2 border border-white/15 shadow-lg flex items-center justify-center">
                                 <img src={leadingTeam.logo} alt={leadingTeam.name} className="w-full h-full object-contain" />
                              </div>
                           ) : (
                              <div className="w-16 h-16 bg-red-500/10 rounded-2xl p-2 border border-red-500/20 flex items-center justify-center text-3xl">
                                 🏏
                              </div>
                           )}

                           <div className="relative w-36 h-36 my-1">
                              <img
                                 src={currentPlayer?.image}
                                 className="relative w-full h-full object-contain z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                                 alt={currentPlayer?.name}
                                 onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(currentPlayer?.name || 'Player');
                                 }}
                              />
                           </div>

                           <h2 className="text-2xl font-black uppercase text-white tracking-tight">{currentPlayer?.name}</h2>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentPlayer?.role} • {currentPlayer?.country}</p>

                           <div className={`w-full py-3 px-4 rounded-2xl mt-2 border ${isSold ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'}`}>
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">
                                 {isSold ? `Sold to ${displayAuctionState?.highBidderName || leadingTeam?.name}` : 'Auction Status'}
                              </span>
                              <span className={`text-2xl font-black ${isSold ? 'text-yellow-400' : 'text-red-400'}`}>
                                 {isSold ? `₹${formatCrores(displayAuctionState?.currentBid)} Cr` : 'UNSOLD'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ) : (
                  <motion.div
                     key="player-live-card"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="w-full bg-gradient-to-b from-[#161616] to-[#0c0c0c] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl relative"
                  >
                     {/* Pause Mask */}
                     {isTimerPaused && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2 rounded-[2rem]">
                           <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-6 py-2.5 rounded-full font-black text-sm tracking-widest uppercase flex items-center gap-2 shadow-2xl">
                              <Pause size={18} className="animate-pulse" /> AUCTION PAUSED
                           </div>
                           <p className="text-gray-400 text-xs font-semibold">Waiting for host to resume...</p>
                        </div>
                     )}

                     {/* Top Round Timer Bar */}
                     <div className="h-1.5 w-full bg-white/5">
                        <motion.div
                           initial={{ width: "100%" }}
                           animate={{ width: `${timerPercent}%` }}
                           className={`h-full transition-colors duration-1000 ${isTimerPaused ? 'bg-gray-500' : secondsRemaining < 5 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}
                        />
                     </div>

                     <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                        {/* Player Photo */}
                        <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2rem] overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                           <img 
                              src={currentPlayer?.image} 
                              alt={currentPlayer?.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                 e.target.onerror = null;
                                 e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(currentPlayer?.name || 'Player');
                              }}
                           />
                        </div>

                        {/* Player Info & Live Bid Display */}
                        <div className="flex-1 w-full flex flex-col gap-4 text-center md:text-left">
                           <div>
                              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                                 <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-wider">
                                    {currentPlayer?.role}
                                 </span>
                                 <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-wider">
                                    {currentPlayer?.country}
                                 </span>
                                 {currentPlayer?.type && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[9px] font-black uppercase tracking-wider">
                                       {currentPlayer?.type}
                                    </span>
                                 )}
                              </div>
                              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                                 {currentPlayer?.name}
                              </h1>
                           </div>

                           {/* Clean 2-Stat Focus Strip */}
                           <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-2xl max-w-sm mx-auto md:mx-0">
                              {keyStats.map((st, i) => (
                                 <div key={i} className="text-center">
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">{st.label}</span>
                                    <span className={`text-xl font-black ${st.color}`}>{st.value}</span>
                                 </div>
                              ))}
                           </div>

                           {/* Bid & Timer Row */}
                           <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                              <div>
                                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Current Bid</span>
                                 <div className="flex items-center gap-2">
                                    <span className="text-2xl sm:text-3xl font-black text-white">
                                       {displayAuctionState?.currentBid == null ? '—' : `₹${formatCrores(displayAuctionState.currentBid)} Cr`}
                                    </span>
                                    {leadingTeam && (
                                       <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-xl">
                                          <div className="w-5 h-5 rounded-md bg-white/5 p-0.5 flex items-center justify-center">
                                             <img src={leadingTeam.logo} alt={leadingTeam.name} className="w-full h-full object-contain" />
                                          </div>
                                          <span className="text-[9px] font-black text-gray-300 uppercase">{leadingTeam.id}</span>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* Countdown Dial */}
                              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all ${isTimerPaused
                                 ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                                 : inLastCall
                                    ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                                    : secondsRemaining < 5
                                       ? 'border-red-500 bg-red-500/10 text-red-500'
                                       : 'border-green-500/40 bg-green-500/10 text-green-400'
                                 }`}>
                                 {inLastCall ? (
                                    <span className="text-[8px] font-black text-red-400 uppercase text-center px-1 leading-tight">
                                       Last Call
                                    </span>
                                 ) : (
                                    <>
                                       <span className="text-lg sm:text-xl font-black leading-none">{secondsRemaining}</span>
                                       <span className="text-[7px] font-bold uppercase tracking-widest mt-0.5">SEC</span>
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Ergonomic Single-Action Bottom Zone */}
         <div className="w-full pt-4 shrink-0 flex flex-col gap-2.5">
            {/* Quick Team Status Strip */}
            {team && (
               <div className="w-full flex items-center justify-around bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl text-[9px] sm:text-[11px] font-bold text-gray-400">
                  <span>Squad: <strong className="text-blue-400">{team.squad?.length || 0}/{toFiniteNumber(currentAuction?.squadLimit, 25)}</strong></span>
                  <div className="w-px h-3 bg-white/10" />
                  <span>Overseas: <strong className="text-purple-400">{countOverseas(team.squad, IPL_PLAYERS)}/{toFiniteNumber(currentAuction?.overseasLimit, 8)}</strong></span>
                  <div className="w-px h-3 bg-white/10" />
                  <span>Purse Left: <strong className="text-green-400">₹{formatCrores(team.budgetRemaining ?? toFiniteNumber(currentAuction?.settings?.budget, 120), 1)} Cr</strong></span>
               </div>
            )}

            {/* 1 Large, Thumb-Friendly Bid Button */}
            <button
               onClick={handleBid}
               disabled={spectateMode || !team || displayAuctionState?.status !== 'bidding' || isLeadingBidder || isBiddingInFlight}
               className={`w-full h-14 sm:h-16 rounded-2xl font-black text-sm sm:text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl active:scale-[0.98] select-none ${spectateMode
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : isLeadingBidder
                     ? 'bg-white/5 text-green-400 border border-green-500/30'
                     : isTimerPaused
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 cursor-not-allowed'
                        : inLastCall
                           ? 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-black shadow-red-500/20 animate-pulse'
                           : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black shadow-green-500/20'
                  }`}
            >
               {spectateMode ? (
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400">
                     <Eye size={18} /> Spectator Mode (Read Only)
                  </span>
               ) : isTimerPaused ? (
                  'AUCTION PAUSED'
               ) : isLeadingBidder ? (
                  <span className="flex items-center gap-2 text-green-400 uppercase tracking-wider">
                     YOU ARE THE HIGHEST BIDDER
                  </span>
               ) : inLastCall ? (
                  `LAST CALL — PLACE BID: ₹${formatCrores(nextBidAmount)} Cr`
               ) : (
                  `PLACE BID: ₹${formatCrores(nextBidAmount)} Cr`
               )}
            </button>
         </div>
      </div>
   );
};

export default ArenaView;
