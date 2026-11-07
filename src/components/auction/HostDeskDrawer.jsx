import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, PlayCircle, XCircle, Users, Sliders, ShieldAlert } from 'lucide-react';
import { TEAMS } from '../../data/teams';

const HostDeskDrawer = ({
   isOpen,
   onClose,
   displayAuctionState,
   currentAuction,
   id,
   pauseAuction,
   resumeAuction,
   setShowEndConfirm,
   updateRoomSettings,
   kickPlayer,
   setError
}) => {
   const [timerVal, setTimerVal] = useState(currentAuction?.settings?.bidTimer || 10);
   const isPaused = displayAuctionState?.status === 'paused';

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex justify-end">
         <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-[#0e0f14] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl overflow-y-auto custom-scrollbar"
         >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                     <Sliders size={16} />
                  </div>
                  <div>
                     <h3 className="text-base font-black uppercase tracking-tight text-white">Host Control Desk</h3>
                     <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Manage Auction Pace & Room</p>
                  </div>
               </div>
               <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
               >
                  <X size={16} />
               </button>
            </div>

            {/* Section 1: Match Flow */}
            <div className="space-y-4 mb-6">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auction Flow</span>
               <div className="grid grid-cols-2 gap-3">
                  {isPaused ? (
                     <button
                        onClick={() => {
                           if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                           resumeAuction(id);
                        }}
                        className="py-3 px-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                     >
                        <PlayCircle size={16} /> Resume
                     </button>
                  ) : (
                     <button
                        onClick={() => {
                           if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                           pauseAuction(id);
                        }}
                        className="py-3 px-4 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                     >
                        <Pause size={16} /> Pause
                     </button>
                  )}

                  <button
                     onClick={() => {
                        setShowEndConfirm(true);
                        onClose();
                     }}
                     className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                     <XCircle size={16} /> End Auction
                  </button>
               </div>
            </div>

            {/* Section 2: Bid Pacing */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Round Bid Timer</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-xs">
                     {timerVal} Seconds
                  </span>
               </div>
               <input
                  type="range"
                  min="5"
                  max="60"
                  value={timerVal}
                  onChange={(e) => setTimerVal(parseInt(e.target.value))}
                  className="w-full accent-blue-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
               />
               <button
                  onClick={async () => {
                     await updateRoomSettings(id, { ...currentAuction?.settings, bidTimer: timerVal });
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all shadow-md shadow-blue-500/20"
               >
                  Apply New Bid Timer
               </button>
            </div>

            {/* Section 3: Active Participants & Moderation */}
            <div className="space-y-3 flex-1 flex flex-col">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Room Managers</span>
                  <span className="text-[10px] font-bold text-gray-500">
                     {currentAuction?.players?.length || 0} Connected
                  </span>
               </div>

               <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                  {(currentAuction?.players || []).map((player) => {
                     const teamObj = TEAMS.find(t => t.id === player.team);
                     return (
                        <div key={player.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white/5 p-1 flex items-center justify-center shrink-0">
                                 {teamObj ? (
                                    <img src={teamObj.logo} alt={teamObj.name} className="w-full h-full object-contain" />
                                 ) : (
                                    <Users size={16} className="text-gray-500" />
                                 )}
                              </div>
                              <div>
                                 <span className="text-xs font-bold text-white block">
                                    {player.name} {player.isHost && <strong className="text-yellow-400 text-[9px]">(Host)</strong>}
                                 </span>
                                 <span className="text-[9px] text-gray-500 uppercase">{player.teamName || 'Spectator'}</span>
                              </div>
                           </div>

                           {!player.isHost && (
                              <button
                                 onClick={async () => {
                                    if (window.confirm(`Kick ${player.name} from auction?`)) {
                                       try {
                                          await kickPlayer(id, player);
                                       } catch {
                                          setError('Failed to kick player.');
                                          setTimeout(() => setError(''), 3000);
                                       }
                                    }
                                 }}
                                 className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                              >
                                 Kick
                              </button>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
         </motion.div>
      </div>
   );
};

export default HostDeskDrawer;
