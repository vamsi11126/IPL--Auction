import React from 'react';
import { Copy, CheckCircle2, Eye, Settings as SettingsIcon, Home, Sliders, Gavel, Users, BookOpen, MessageSquare } from 'lucide-react';
import { formatCrores } from '../../lib/auctionDisplay';

const AuctionNavbar = ({
   id,
   copied,
   copyRoomId,
   spectateMode,
   currentAuction,
   team,
   isAdmin,
   activeScreen,
   setActiveScreen,
   setShowHostDesk,
   showSettings,
   setShowSettings,
   navigate
}) => {
   const tabs = [
      { id: 'arena', label: 'Arena', icon: Gavel },
      { id: 'squads', label: 'Squads', icon: Users },
      { id: 'catalog', label: 'Catalog', icon: BookOpen },
      { id: 'war-room', label: 'War Room', icon: MessageSquare }
   ];

   return (
      <>
         {/* Top Header */}
         <header className="w-full h-14 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-3 sm:px-6 z-50 shrink-0 gap-2">
            {/* Left Info: Room ID + Status */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
               <button
                  onClick={copyRoomId}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-gray-300"
                  title="Click to copy Room Code"
               >
                  <span className="font-mono font-bold text-xs sm:text-sm text-white">{id}</span>
                  {copied ? <CheckCircle2 size={13} className="text-green-400" /> : <Copy size={13} />}
               </button>

               <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>{currentAuction?.players?.filter(p => p.team).length || 0}/10 Teams</span>
               </div>

               {spectateMode && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[9px] uppercase tracking-wider rounded-full">
                     <Eye size={11} /> Spectating
                  </span>
               )}
            </div>

            {/* Center: Desktop Screen Switcher */}
            <nav className="hidden md:flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
               {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeScreen === tab.id;
                  return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveScreen(tab.id)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${isActive
                           ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                           : 'text-gray-400 hover:text-white hover:bg-white/5'
                           }`}
                     >
                        <Icon size={14} />
                        <span>{tab.label}</span>
                     </button>
                  );
               })}
            </nav>

            {/* Right: User Team Pill + Host Desk + Settings + Home */}
            <div className="flex items-center gap-2 shrink-0">
               {team && (
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl">
                     <span className="text-[10px] font-black text-white uppercase">{team.teamId}</span>
                     <span className="text-[10px] font-bold text-green-400">₹{formatCrores(team.budgetRemaining, 1)}Cr</span>
                  </div>
               )}

               {isAdmin && (
                  <button
                     onClick={() => setShowHostDesk(true)}
                     className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                     title="Host Control Desk"
                  >
                     <Sliders size={13} />
                     <span className="hidden sm:inline">Host Desk</span>
                  </button>
               )}

               <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${showSettings ? 'bg-white/15 text-white border-white/30' : 'bg-white/5 text-gray-400 hover:text-white border-white/10'}`}
                  title="Audio & Room Settings"
               >
                  <SettingsIcon size={15} />
               </button>

               <button
                  onClick={() => navigate('/')}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="Leave to Home"
               >
                  <Home size={15} />
               </button>
            </div>
         </header>

         {/* Bottom Mobile Tab Bar */}
         <div className="flex md:hidden fixed bottom-0 inset-x-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-50 h-14 items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            {tabs.map((tab) => {
               const Icon = tab.icon;
               const isActive = activeScreen === tab.id;
               return (
                  <button
                     key={tab.id}
                     onClick={() => setActiveScreen(tab.id)}
                     className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${isActive ? 'text-yellow-400 scale-105' : 'text-gray-500 hover:text-gray-400'}`}
                  >
                     <Icon size={18} />
                     <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{tab.label}</span>
                  </button>
               );
            })}
         </div>
      </>
   );
};

export default AuctionNavbar;
