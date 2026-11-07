import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { IPL_PLAYERS } from '../../data/players';
import { TEAMS } from '../../data/teams';
import { TEAM_SLOGANS } from '../../data/slogans';
import { formatCrores } from '../../lib/auctionDisplay';

const SoldCard = ({ msg }) => {
   const cardRef = useRef(null);
   const player = IPL_PLAYERS.find(p => p.id === msg?.metadata?.playerId);
   const team = TEAMS.find(t => t.id === msg?.metadata?.teamId);
   const slogan = TEAM_SLOGANS[msg?.metadata?.teamId] || { slogan: 'IPL 2026!', hashtag: '#IPL' };

   const handleSave = async () => {
      if (!cardRef.current || !player) return;
      try {
         const dataUrl = await toPng(cardRef.current, {
            cacheBust: false,
            pixelRatio: 2,
            skipFonts: true,
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
         });
         const link = document.createElement('a');
         link.download = `${player.name}_Sold.png`;
         link.href = dataUrl;
         link.click();
      } catch (err) {
         console.error('Error saving image:', err);
      }
   };

   return (
      <div className="space-y-2 mb-4 sm:mb-6">
         <div ref={cardRef} className="relative w-full min-h-[380px] max-h-[460px] h-auto aspect-[4/5] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-[#0A0A0B] border border-white/10 shadow-2xl">
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${team?.color?.replace('bg-', 'from-') || 'from-yellow-500'} to-black`} />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

            <div className="relative h-full flex flex-col p-4 sm:p-6 z-10 justify-between">
               <div className="flex justify-between items-start mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-white/10">
                     <img src={team?.logo} alt={`${team?.name || 'Franchise'} Logo`} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-right uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                     <p className="text-[7px] sm:text-[8px] font-black text-blue-500 mb-0.5">IPL Auction</p>
                     <p className="text-[9px] sm:text-[10px] font-bold text-white/50 leading-none">Sold to</p>
                     <p className="text-[11px] sm:text-[12px] font-black text-white">{msg?.metadata?.buyerName}</p>
                  </div>
               </div>

               <div className="flex-1 flex flex-col justify-center items-center py-2 sm:py-4">
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 group">
                     <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 ${team?.color || 'bg-yellow-500'}`} />
                     <img
                        src={player?.image}
                        className="relative w-full h-full object-contain z-10 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        alt={player?.name || 'Sold Player'}
                        onError={(e) => {
                           e.target.onerror = null;
                           e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(player?.name || 'Player');
                        }}
                     />
                  </div>
                  <div className="text-center mt-2 sm:mt-4">
                     <h2 className="text-xl sm:text-2xl compact:text-xl font-black uppercase tracking-tight text-white leading-tight">{player?.name}</h2>
                     <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">{player?.role} • {player?.country}</p>
                  </div>
               </div>

               <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                     <p className="text-sm sm:text-[15px] font-black italic uppercase tracking-wider text-yellow-500 drop-shadow-lg">#{slogan.slogan}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center">
                     <p className="text-xl sm:text-2xl compact:text-xl font-black text-white">₹{formatCrores(msg?.metadata?.bid)} Cr</p>
                  </div>
               </div>
            </div>
         </div>
         <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10 text-gray-400 hover:text-white cursor-pointer active:scale-98">
            <Download size={14} /> Save Player Card
         </button>
      </div>
   );
};

export default SoldCard;
